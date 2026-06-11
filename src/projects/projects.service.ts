import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  Prisma,
  ProjectStatus,
  TenderStageEventType,
  TenderStageStatus,
  TenderStageType,
} from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { AuthorizationService } from '../authorization/authorization.service';
import {
  CreateProjectInput,
  CreateTenderStageEventDocumentInput,
  CreateTenderStageEventInput,
  CreateTenderStageDocumentInput,
  UpdateProjectInput,
  UpdateTenderStageInput,
} from './dto/project.inputs';

const TENDER_STAGE_DOCUMENT_OWNER_TYPE = 'PROJECT_TENDER_STAGE';
const TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE = 'PROJECT_TENDER_STAGE_EVENT';

const projectInclude = Prisma.validator<Prisma.ProjectInclude>()({
  configuration: true,
  tenderStages: {
    orderBy: { sequence: 'asc' },
    include: {
      events: {
        orderBy: { sequence: 'asc' },
      },
    },
  },
});

const TENDER_STAGE_DEFINITIONS: Array<{
  stage: TenderStageType;
  sequence: number;
}> = [
  { stage: TenderStageType.TENDER_RECEIVED, sequence: 1 },
  { stage: TenderStageType.SITE_VISIT, sequence: 2 },
  { stage: TenderStageType.PREBID_QUERY, sequence: 3 },
  { stage: TenderStageType.TENDER_SUBMISSION, sequence: 4 },
  { stage: TenderStageType.CLARIFICATION, sequence: 5 },
  { stage: TenderStageType.AUCTION, sequence: 6 },
  { stage: TenderStageType.NEGOTIATION, sequence: 7 },
  { stage: TenderStageType.LOI_AWARDED, sequence: 8 },
];

const ALLOWED_STAGE_EVENT_TYPES: Record<TenderStageType, TenderStageEventType[]> = {
  [TenderStageType.TENDER_RECEIVED]: [TenderStageEventType.TENDER_RECEIVED],
  [TenderStageType.SITE_VISIT]: [TenderStageEventType.SITE_VISIT],
  [TenderStageType.PREBID_QUERY]: [
    TenderStageEventType.PREBID_QUERY_SENT,
    TenderStageEventType.PREBID_QUERY_RESPONSE,
  ],
  [TenderStageType.TENDER_SUBMISSION]: [
    TenderStageEventType.TENDER_TECHNICAL_SUBMISSION,
    TenderStageEventType.TENDER_PRICE_SUBMISSION,
  ],
  [TenderStageType.CLARIFICATION]: [
    TenderStageEventType.CLARIFICATION_SENT,
    TenderStageEventType.CLARIFICATION_RECEIVED,
  ],
  [TenderStageType.AUCTION]: [TenderStageEventType.AUCTION],
  [TenderStageType.NEGOTIATION]: [TenderStageEventType.NEGOTIATION],
  [TenderStageType.LOI_AWARDED]: [TenderStageEventType.LOI_AWARDED],
};

type ProjectWithStages = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

type TenderStageRecord = Prisma.ProjectTenderStageGetPayload<object>;
type TenderStageWithEvents = Prisma.ProjectTenderStageGetPayload<{
  include: { events: true };
}>;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly documentsService: DocumentsService,
  ) {}

  async createProject(input: CreateProjectInput, creatorUserId: string) {
    const createdProject = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: input.title.trim(),
          description: input.description?.trim(),
          status: ProjectStatus.TENDERING,
          configuration: {
            create: {},
          },
          tenderStages: {
            create: TENDER_STAGE_DEFINITIONS.map((definition) => ({
              stage: definition.stage,
              sequence: definition.sequence,
            })),
          },
        },
        include: { configuration: true, tenderStages: true },
      });

      await this.authorizationService.createDefaultProjectRoles(project.id, tx);
      const adminRole = await this.authorizationService.getProjectAdminRole(
        project.id,
        tx,
      );

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: creatorUserId,
          roleId: adminRole.id,
          designation: 'Project Admin',
        },
      });

      return project;
    });

    return this.getProject(createdProject.id);
  }

  async listMyProjects(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        project: {
          include: projectInclude,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const projectIds = [
      ...new Set(memberships.map((membership) => membership.projectId)),
    ];
    for (const projectId of projectIds) {
      await this.authorizationService.createDefaultProjectRoles(projectId);
    }

    return Promise.all(
      memberships.map((membership) => this.mapProject(membership.project)),
    );
  }

  async getProject(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });

    return this.mapProject(project);
  }

  async updateProject(projectId: string, input: UpdateProjectInput) {
    if (input.projectId !== projectId) {
      throw new BadRequestException('Project id does not match active project.');
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.title.trim(),
        description: input.description?.trim() || null,
      },
      include: projectInclude,
    });

    return this.mapProject(project);
  }

  async deleteProject(projectId: string) {
    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return true;
  }

  async listTenderStages(projectId: string) {
    const tenderStages = await this.prisma.projectTenderStage.findMany({
      where: { projectId },
      orderBy: { sequence: 'asc' },
      include: {
        events: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return this.mapTenderStages(projectId, tenderStages);
  }

  async getTenderStage(projectId: string, stageId: string) {
    const stage = await this.prisma.projectTenderStage.findFirstOrThrow({
      where: { id: stageId, projectId },
      include: {
        events: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    const [mappedStage] = await this.mapTenderStages(projectId, [stage]);
    return mappedStage;
  }

  async startTenderStage(projectId: string, input: UpdateTenderStageInput) {
    const stage = await this.getTenderStageRecord(projectId, input.stageId);
    await this.ensurePriorStagesHandled(projectId, stage.sequence);

    if (
      stage.status === TenderStageStatus.COMPLETED ||
      stage.status === TenderStageStatus.SKIPPED
    ) {
      throw new BadRequestException(
        'Completed or skipped tender stages cannot be started again.',
      );
    }

    const updatedStage = await this.prisma.projectTenderStage.update({
      where: { id: stage.id },
      data: {
        status: TenderStageStatus.IN_PROGRESS,
        startedAt: stage.startedAt ?? new Date(),
        note: input.note?.trim() || stage.note,
      },
    });

    return this.getTenderStage(projectId, updatedStage.id);
  }

  async completeTenderStage(projectId: string, input: UpdateTenderStageInput) {
    const stage = await this.getTenderStageRecord(projectId, input.stageId);
    await this.ensurePriorStagesHandled(projectId, stage.sequence);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Skipped tender stages cannot be completed.',
      );
    }

    if (stage.status === TenderStageStatus.COMPLETED) {
      throw new BadRequestException('Tender stage is already completed.');
    }

    const now = new Date();
    const updatedStage = await this.prisma.projectTenderStage.update({
      where: { id: stage.id },
      data: {
        status: TenderStageStatus.COMPLETED,
        startedAt: stage.startedAt ?? now,
        completedAt: now,
        skippedAt: null,
        note: input.note?.trim() || stage.note,
      },
    });

    return this.getTenderStage(projectId, updatedStage.id);
  }

  async skipTenderStage(projectId: string, input: UpdateTenderStageInput) {
    const stage = await this.getTenderStageRecord(projectId, input.stageId);
    await this.ensurePriorStagesHandled(projectId, stage.sequence);

    if (stage.status === TenderStageStatus.COMPLETED) {
      throw new BadRequestException(
        'Completed tender stages cannot be skipped.',
      );
    }

    const updatedStage = await this.prisma.projectTenderStage.update({
      where: { id: stage.id },
      data: {
        status: TenderStageStatus.SKIPPED,
        skippedAt: new Date(),
        note: input.note?.trim() || stage.note,
      },
    });

    return this.getTenderStage(projectId, updatedStage.id);
  }

  async createTenderStageDocument(
    projectId: string,
    input: CreateTenderStageDocumentInput,
  ) {
    const stage = await this.getTenderStageRecord(projectId, input.stageId);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Documents cannot be attached to skipped tender stages.',
      );
    }

    return this.documentsService.createDocument(projectId, {
      ownerType: TENDER_STAGE_DOCUMENT_OWNER_TYPE,
      ownerId: stage.id,
      title: input.title,
      description: input.description,
      documentDate: input.documentDate,
    });
  }

  async createTenderStageEvent(
    projectId: string,
    input: CreateTenderStageEventInput,
  ) {
    const stage = await this.getTenderStageRecord(projectId, input.stageId);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Events cannot be added to skipped tender stages.',
      );
    }

    const allowedEventTypes = ALLOWED_STAGE_EVENT_TYPES[stage.stage];
    if (!allowedEventTypes.includes(input.eventType)) {
      throw new BadRequestException(
        `${input.eventType} cannot be added under ${stage.stage}.`,
      );
    }

    const eventDate = new Date(input.eventDate);
    if (Number.isNaN(eventDate.getTime())) {
      throw new BadRequestException('A valid tender event date is required.');
    }

    const lastEvent = await this.prisma.projectTenderStageEvent.findFirst({
      where: { stageId: stage.id },
      orderBy: { sequence: 'desc' },
    });

    const createdEvent = await this.prisma.projectTenderStageEvent.create({
      data: {
        projectId,
        stageId: stage.id,
        eventType: input.eventType,
        eventDate,
        note: input.note?.trim() || null,
        sequence: (lastEvent?.sequence ?? 0) + 1,
      },
    });

    return this.getTenderStageEvent(projectId, createdEvent.id);
  }

  async createTenderStageEventDocument(
    projectId: string,
    input: CreateTenderStageEventDocumentInput,
  ) {
    const event = await this.getTenderStageEventRecord(projectId, input.eventId);
    const stage = await this.getTenderStageRecord(projectId, event.stageId);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Documents cannot be attached to skipped tender stages.',
      );
    }

    return this.documentsService.createDocument(projectId, {
      ownerType: TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE,
      ownerId: event.id,
      title: input.title,
      description: input.description,
      documentDate: input.documentDate,
    });
  }

  private async getTenderStageRecord(projectId: string, stageId: string) {
    return this.prisma.projectTenderStage.findFirstOrThrow({
      where: { id: stageId, projectId },
    });
  }

  private async getTenderStageEventRecord(projectId: string, eventId: string) {
    return this.prisma.projectTenderStageEvent.findFirstOrThrow({
      where: { id: eventId, projectId },
    });
  }

  private async getTenderStageEvent(projectId: string, eventId: string) {
    const event = await this.getTenderStageEventRecord(projectId, eventId);
    const documents = await this.documentsService.listDocuments(
      projectId,
      TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE,
    );

    return {
      ...event,
      note: event.note ?? undefined,
      documents: documents.filter((document) => document.ownerId === event.id),
    };
  }

  private async ensurePriorStagesHandled(projectId: string, sequence: number) {
    const blockingStage = await this.prisma.projectTenderStage.findFirst({
      where: {
        projectId,
        sequence: { lt: sequence },
        status: {
          notIn: [TenderStageStatus.COMPLETED, TenderStageStatus.SKIPPED],
        },
      },
      orderBy: { sequence: 'asc' },
    });

    if (blockingStage) {
      throw new BadRequestException(
        'Complete or skip earlier tender stages before moving to a later stage.',
      );
    }
  }

  private async mapProject(project: ProjectWithStages) {
    const tenderStages = await this.mapTenderStages(project.id, project.tenderStages);

    return {
      ...project,
      description: project.description ?? undefined,
      tenderStages,
    };
  }

  private async mapTenderStages(projectId: string, stages: TenderStageWithEvents[]) {
    if (stages.length === 0) {
      return [];
    }

    const [stageDocuments, eventDocuments] = await Promise.all([
      this.documentsService.listDocuments(projectId, TENDER_STAGE_DOCUMENT_OWNER_TYPE),
      this.documentsService.listDocuments(projectId, TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE),
    ]);
    const stageDocumentsByOwnerId = new Map<string, typeof stageDocuments>();
    const eventDocumentsByOwnerId = new Map<string, typeof eventDocuments>();

    for (const document of stageDocuments) {
      const existing = stageDocumentsByOwnerId.get(document.ownerId) ?? [];
      existing.push(document);
      stageDocumentsByOwnerId.set(document.ownerId, existing);
    }

    for (const document of eventDocuments) {
      const existing = eventDocumentsByOwnerId.get(document.ownerId) ?? [];
      existing.push(document);
      eventDocumentsByOwnerId.set(document.ownerId, existing);
    }

    return stages.map((stage) => ({
      ...stage,
      note: stage.note ?? undefined,
      startedAt: stage.startedAt ?? undefined,
      completedAt: stage.completedAt ?? undefined,
      skippedAt: stage.skippedAt ?? undefined,
      documents: stageDocumentsByOwnerId.get(stage.id) ?? [],
      events: stage.events.map((event) => ({
        ...event,
        note: event.note ?? undefined,
        documents: eventDocumentsByOwnerId.get(event.id) ?? [],
      })),
    }));
  }
}
