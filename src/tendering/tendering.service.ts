import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  Prisma,
  TenderStageEventType,
  TenderStageStatus,
  TenderStageType,
} from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateTenderStageDocumentInput,
  CreateTenderStageEventDocumentInput,
  CreateTenderStageEventInput,
  DeleteTenderStageEventInput,
  UpdateTenderStageEventInput,
  UpdateTenderStageInput,
} from './dto/tendering.inputs';

const TENDER_STAGE_DOCUMENT_OWNER_TYPE = 'PROJECT_TENDER_STAGE';
const TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE = 'PROJECT_TENDER_STAGE_EVENT';

const ALLOWED_STAGE_EVENT_TYPES: Record<
  TenderStageType,
  TenderStageEventType[]
> = {
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

// Repeatable event types may have multiple rows per stage; all others are
// limited to a single row (re-using sequence 1) so "complete" stages don't
// accumulate duplicate single-occurrence records.
const REPEATABLE_EVENT_TYPES = new Set<TenderStageEventType>([
  TenderStageEventType.PREBID_QUERY_SENT,
  TenderStageEventType.PREBID_QUERY_RESPONSE,
  TenderStageEventType.CLARIFICATION_SENT,
  TenderStageEventType.CLARIFICATION_RECEIVED,
]);

const STAGE_COMPLETION_REQUIREMENTS: Record<
  TenderStageType,
  TenderStageEventType[][]
> = {
  [TenderStageType.TENDER_RECEIVED]: [[TenderStageEventType.TENDER_RECEIVED]],
  [TenderStageType.SITE_VISIT]: [[TenderStageEventType.SITE_VISIT]],
  [TenderStageType.PREBID_QUERY]: [
    [TenderStageEventType.PREBID_QUERY_SENT],
    [TenderStageEventType.PREBID_QUERY_RESPONSE],
  ],
  [TenderStageType.TENDER_SUBMISSION]: [
    [TenderStageEventType.TENDER_TECHNICAL_SUBMISSION],
    [TenderStageEventType.TENDER_PRICE_SUBMISSION],
  ],
  [TenderStageType.CLARIFICATION]: [
    [
      TenderStageEventType.CLARIFICATION_SENT,
      TenderStageEventType.CLARIFICATION_RECEIVED,
    ],
  ],
  [TenderStageType.AUCTION]: [[TenderStageEventType.AUCTION]],
  [TenderStageType.NEGOTIATION]: [[TenderStageEventType.NEGOTIATION]],
  [TenderStageType.LOI_AWARDED]: [[TenderStageEventType.LOI_AWARDED]],
};

type TenderStageWithEvents = Prisma.ProjectTenderStageGetPayload<{
  include: { events: true };
}>;

@Injectable()
export class TenderingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly audit: AuditService,
  ) {}

  async listTenderStages(projectId: string) {
    const stages = await this.prisma.projectTenderStage.findMany({
      where: { projectId },
      orderBy: { sequence: 'asc' },
      include: {
        events: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    return this.mapTenderStages(projectId, stages);
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

  async startTenderStage(
    projectId: string,
    input: UpdateTenderStageInput,
    actorUserId?: string,
  ) {
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

    this.audit.record({
      action: AuditAction.STAGE_START,
      entityType: 'ProjectTenderStage',
      entityId: updatedStage.id,
      projectId,
      userId: actorUserId,
      metadata: { stage: updatedStage.stage },
    });

    return this.getTenderStage(projectId, updatedStage.id);
  }

  async completeTenderStage(
    projectId: string,
    input: UpdateTenderStageInput,
    actorUserId?: string,
  ) {
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

    await this.ensureStageCompletionRecords(projectId, stage);

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

    this.audit.record({
      action: AuditAction.STAGE_COMPLETE,
      entityType: 'ProjectTenderStage',
      entityId: updatedStage.id,
      projectId,
      userId: actorUserId,
      metadata: { stage: updatedStage.stage },
    });

    return this.getTenderStage(projectId, updatedStage.id);
  }

  async skipTenderStage(
    projectId: string,
    input: UpdateTenderStageInput,
    actorUserId?: string,
  ) {
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

    this.audit.record({
      action: AuditAction.STAGE_SKIP,
      entityType: 'ProjectTenderStage',
      entityId: updatedStage.id,
      projectId,
      userId: actorUserId,
      metadata: { stage: updatedStage.stage },
    });

    return this.getTenderStage(projectId, updatedStage.id);
  }

  async createTenderStageDocument(
    projectId: string,
    input: CreateTenderStageDocumentInput,
    actorUserId?: string,
  ) {
    const stage = await this.getTenderStageRecord(projectId, input.stageId);
    await this.ensurePriorStagesHandled(projectId, stage.sequence);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Documents cannot be attached to skipped tender stages.',
      );
    }

    return this.documentsService.createDocument(
      projectId,
      {
        ownerType: TENDER_STAGE_DOCUMENT_OWNER_TYPE,
        ownerId: stage.id,
        title: input.title,
        description: input.description,
        documentDate: input.documentDate,
      },
      actorUserId,
    );
  }

  async createTenderStageEvent(
    projectId: string,
    input: CreateTenderStageEventInput,
    actorUserId?: string,
  ) {
    const stage = await this.getTenderStageRecord(projectId, input.stageId);
    await this.ensurePriorStagesHandled(projectId, stage.sequence);

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

    if (!REPEATABLE_EVENT_TYPES.has(input.eventType)) {
      const existing = await this.prisma.projectTenderStageEvent.findFirst({
        where: { stageId: stage.id, eventType: input.eventType },
      });

      if (existing) {
        throw new BadRequestException(
          `${input.eventType} already exists for this stage. Update it instead of creating a new one.`,
        );
      }
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
        title: input.title?.trim() || null,
        note: input.note?.trim() || null,
        sequence: (lastEvent?.sequence ?? 0) + 1,
      },
    });

    this.audit.record({
      action: AuditAction.CREATE,
      entityType: 'ProjectTenderStageEvent',
      entityId: createdEvent.id,
      projectId,
      userId: actorUserId,
      metadata: { stageId: stage.id, eventType: createdEvent.eventType },
    });

    return this.getTenderStageEvent(projectId, createdEvent.id);
  }

  async updateTenderStageEvent(
    projectId: string,
    input: UpdateTenderStageEventInput,
    actorUserId?: string,
  ) {
    const event = await this.getTenderStageEventRecord(
      projectId,
      input.eventId,
    );
    const stage = await this.getTenderStageRecord(projectId, event.stageId);
    await this.ensurePriorStagesHandled(projectId, stage.sequence);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Events on skipped tender stages cannot be modified.',
      );
    }

    let eventDate = event.eventDate;
    if (input.eventDate) {
      eventDate = new Date(input.eventDate);
      if (Number.isNaN(eventDate.getTime())) {
        throw new BadRequestException('A valid tender event date is required.');
      }
    }

    const updated = await this.prisma.projectTenderStageEvent.update({
      where: { id: event.id },
      data: {
        eventDate,
        title:
          input.title !== undefined ? input.title.trim() || null : event.title,
        note: input.note !== undefined ? input.note.trim() || null : event.note,
      },
    });

    this.audit.record({
      action: AuditAction.UPDATE,
      entityType: 'ProjectTenderStageEvent',
      entityId: updated.id,
      projectId,
      userId: actorUserId,
    });

    return this.getTenderStageEvent(projectId, updated.id);
  }

  async deleteTenderStageEvent(
    projectId: string,
    input: DeleteTenderStageEventInput,
    actorUserId?: string,
  ) {
    const event = await this.getTenderStageEventRecord(
      projectId,
      input.eventId,
    );
    const stage = await this.getTenderStageRecord(projectId, event.stageId);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Events on skipped tender stages cannot be modified.',
      );
    }

    const eventDocuments = await this.documentsService.listDocumentsForOwners(
      projectId,
      TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE,
      [event.id],
    );

    for (const document of eventDocuments) {
      await this.documentsService.deleteDocument(
        projectId,
        document.id,
        actorUserId,
      );
    }

    await this.prisma.projectTenderStageEvent.delete({
      where: { id: event.id },
    });

    this.audit.record({
      action: AuditAction.DELETE,
      entityType: 'ProjectTenderStageEvent',
      entityId: event.id,
      projectId,
      userId: actorUserId,
      metadata: { stageId: stage.id, eventType: event.eventType },
    });

    return true;
  }

  async createTenderStageEventDocument(
    projectId: string,
    input: CreateTenderStageEventDocumentInput,
    actorUserId?: string,
  ) {
    const event = await this.getTenderStageEventRecord(
      projectId,
      input.eventId,
    );
    const stage = await this.getTenderStageRecord(projectId, event.stageId);

    if (stage.status === TenderStageStatus.SKIPPED) {
      throw new BadRequestException(
        'Documents cannot be attached to skipped tender stages.',
      );
    }

    return this.documentsService.createDocument(
      projectId,
      {
        ownerType: TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE,
        ownerId: event.id,
        title: input.title,
        description: input.description,
        documentDate: input.documentDate,
      },
      actorUserId,
    );
  }

  /**
   * Throws if the project's tendering workflow has not reached
   * LOI_AWARDED. Used to gate project-configuration mutations per the
   * "post-LOI lock" requirement: configuration may only be modified once
   * LOI has been awarded and captured as a dated record.
   */
  async ensureLoiAwarded(projectId: string) {
    const loiStage = await this.prisma.projectTenderStage.findUnique({
      where: {
        projectId_stage: {
          projectId,
          stage: TenderStageType.LOI_AWARDED,
        },
      },
    });

    if (!loiStage) {
      throw new NotFoundException('LOI Awarded stage not found for project.');
    }

    if (loiStage.status !== TenderStageStatus.COMPLETED) {
      throw new BadRequestException(
        'Project configuration can only be modified after the LOI Awarded stage is completed.',
      );
    }

    const loiAwardRecord = await this.prisma.projectTenderStageEvent.findFirst({
      where: {
        projectId,
        stageId: loiStage.id,
        eventType: TenderStageEventType.LOI_AWARDED,
      },
      select: { id: true },
    });

    if (!loiAwardRecord) {
      throw new BadRequestException(
        'Project configuration can only be modified after a dated LOI Award record is added.',
      );
    }
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
    const documents = await this.documentsService.listDocumentsForOwners(
      projectId,
      TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE,
      [event.id],
    );

    return {
      ...event,
      title: event.title ?? undefined,
      note: event.note ?? undefined,
      documents,
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

  private async ensureStageCompletionRecords(
    projectId: string,
    stage: {
      id: string;
      stage: TenderStageType;
    },
  ) {
    const requiredGroups = STAGE_COMPLETION_REQUIREMENTS[stage.stage];
    const requiredTypes = [...new Set(requiredGroups.flat())];
    const existingEvents = await this.prisma.projectTenderStageEvent.findMany({
      where: {
        projectId,
        stageId: stage.id,
        eventType: { in: requiredTypes },
      },
      select: { eventType: true },
    });
    const existingTypes = new Set(
      existingEvents.map((event) => event.eventType),
    );

    const missingGroups = requiredGroups.filter(
      (group) => !group.some((eventType) => existingTypes.has(eventType)),
    );

    if (missingGroups.length > 0) {
      throw new BadRequestException(
        `Cannot complete ${stage.stage} before adding required dated record(s): ${missingGroups
          .map((group) => group.join(' or '))
          .join(', ')}.`,
      );
    }
  }

  private async mapTenderStages(
    projectId: string,
    stages: TenderStageWithEvents[],
  ) {
    if (stages.length === 0) return [];

    const stageIds = stages.map((stage) => stage.id);
    const eventIds = stages.flatMap((stage) =>
      stage.events.map((event) => event.id),
    );

    const [stageDocuments, eventDocuments] = await Promise.all([
      this.documentsService.listDocumentsForOwners(
        projectId,
        TENDER_STAGE_DOCUMENT_OWNER_TYPE,
        stageIds,
      ),
      this.documentsService.listDocumentsForOwners(
        projectId,
        TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE,
        eventIds,
      ),
    ]);

    const stageDocsByOwnerId = new Map<string, typeof stageDocuments>();
    const eventDocsByOwnerId = new Map<string, typeof eventDocuments>();

    for (const doc of stageDocuments) {
      const existing = stageDocsByOwnerId.get(doc.ownerId) ?? [];
      existing.push(doc);
      stageDocsByOwnerId.set(doc.ownerId, existing);
    }

    for (const doc of eventDocuments) {
      const existing = eventDocsByOwnerId.get(doc.ownerId) ?? [];
      existing.push(doc);
      eventDocsByOwnerId.set(doc.ownerId, existing);
    }

    return stages.map((stage) => ({
      ...stage,
      note: stage.note ?? undefined,
      startedAt: stage.startedAt ?? undefined,
      completedAt: stage.completedAt ?? undefined,
      skippedAt: stage.skippedAt ?? undefined,
      documents: stageDocsByOwnerId.get(stage.id) ?? [],
      events: stage.events.map((event) => ({
        ...event,
        title: event.title ?? undefined,
        note: event.note ?? undefined,
        documents: eventDocsByOwnerId.get(event.id) ?? [],
      })),
    }));
  }
}
