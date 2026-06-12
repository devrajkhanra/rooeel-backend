import {
  TenderStageEventType,
  TenderStageStatus,
  TenderStageType,
} from '@prisma/client';
import { TenderingService } from './tendering.service';

describe('TenderingService', () => {
  const prisma = {
    projectTenderStage: {
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
    },
    projectTenderStageEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
  } as any;

  const documentsService = {
    createDocument: jest.fn(),
    listDocumentsForOwners: jest.fn(),
  } as any;

  const audit = {
    record: jest.fn(),
  } as any;

  let service: TenderingService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TenderingService(prisma, documentsService, audit);
  });

  it('blocks later-stage events until prior stages are completed or skipped', async () => {
    prisma.projectTenderStage.findFirstOrThrow.mockResolvedValue({
      id: 'site-visit-stage',
      projectId: 'project-1',
      stage: TenderStageType.SITE_VISIT,
      sequence: 2,
      status: TenderStageStatus.NOT_STARTED,
    });
    prisma.projectTenderStage.findFirst.mockResolvedValue({
      id: 'tender-received-stage',
      projectId: 'project-1',
      stage: TenderStageType.TENDER_RECEIVED,
      sequence: 1,
      status: TenderStageStatus.NOT_STARTED,
    });

    await expect(
      service.createTenderStageEvent(
        'project-1',
        {
          stageId: 'site-visit-stage',
          eventType: TenderStageEventType.SITE_VISIT,
          eventDate: '2026-06-12',
        },
        'user-1',
      ),
    ).rejects.toThrow(
      'Complete or skip earlier tender stages before moving to a later stage.',
    );

    expect(prisma.projectTenderStageEvent.create).not.toHaveBeenCalled();
  });

  it('blocks stage completion until required dated records exist', async () => {
    prisma.projectTenderStage.findFirstOrThrow.mockResolvedValue({
      id: 'tender-received-stage',
      projectId: 'project-1',
      stage: TenderStageType.TENDER_RECEIVED,
      sequence: 1,
      status: TenderStageStatus.IN_PROGRESS,
      note: null,
      startedAt: null,
    });
    prisma.projectTenderStage.findFirst.mockResolvedValue(null);
    prisma.projectTenderStageEvent.findMany.mockResolvedValue([]);

    await expect(
      service.completeTenderStage(
        'project-1',
        { stageId: 'tender-received-stage' },
        'user-1',
      ),
    ).rejects.toThrow(
      'Cannot complete TENDER_RECEIVED before adding required dated record(s): TENDER_RECEIVED.',
    );

    expect(prisma.projectTenderStage.update).not.toHaveBeenCalled();
  });
});
