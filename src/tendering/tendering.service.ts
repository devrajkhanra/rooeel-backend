import { BadRequestException, Injectable } from '@nestjs/common';
import {
  TenderStageEventType,
  TenderStageStatus,
  TenderStageType,
} from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import {
  CreateTenderStageDocumentInput,
  CreateTenderStageEventDocumentInput,
  CreateTenderStageEventInput,
  UpdateTenderStageInput,
} from './dto/tendering.inputs';

const TENDER_STAGE_DOCUMENT_OWNER_TYPE = 'PROJECT_TENDER_STAGE';
const TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE = 'PROJECT_TENDER_STAGE_EVENT';

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

@Injectable()
export class TenderingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
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
      throw new BadRequestException('Skipped tender stages cannot be completed.');
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
      throw new BadRequestException('Completed tender stages cannot be skipped.');
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
      throw new BadRequestException('Events cannot be added to skipped tender stages.');
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
      documents: documents.filter((doc) => doc.ownerId === event.id),
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

  private async mapTenderStages(
    projectId: string,
    stages: Awaited<
      ReturnType<typeof this.prisma.projectTenderStage.findMany<{ include: { events: true } }>>
    >,
  ) {
    if (stages.length === 0) return [];

    const [stageDocuments, eventDocuments] = await Promise.all([
      this.documentsService.listDocuments(projectId, TENDER_STAGE_DOCUMENT_OWNER_TYPE),
      this.documentsService.listDocuments(projectId, TENDER_STAGE_EVENT_DOCUMENT_OWNER_TYPE),
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
        note: event.note ?? undefined,
        documents: eventDocsByOwnerId.get(event.id) ?? [],
      })),
    }));
  }
}
