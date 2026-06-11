import { BadRequestException } from '@nestjs/common';
import {
  ProjectStatus,
  TenderStageStatus,
  TenderStageType,
} from '@prisma/client';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const prisma = {
    $transaction: jest.fn(),
    project: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    projectMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    projectRole: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    projectTenderStage: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
    },
    projectTenderStageEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
  } as any;

  const authorizationService = {
    createDefaultProjectRoles: jest.fn(),
    getProjectAdminRole: jest.fn(),
    setRolePermissions: jest.fn(),
    userHasPermissions: jest.fn(),
  } as any;

  const documentsService = {
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
  } as any;

  let service: ProjectsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(prisma, authorizationService, documentsService);
  });

  it('seeds the tendering stages when a project is created', async () => {
    const seededStages = [
      {
        id: 'stage-1',
        projectId: 'project-1',
        stage: TenderStageType.SITE_VISIT,
        sequence: 1,
        status: TenderStageStatus.NOT_STARTED,
        note: null,
        startedAt: null,
        completedAt: null,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        events: [],
      },
    ];

    const createdProject = {
      id: 'project-1',
      name: 'Metro Package',
      description: null,
      status: ProjectStatus.TENDERING,
      configuration: {
        id: 'config-1',
        projectId: 'project-1',
      },
      tenderStages: seededStages,
    };

    const tx = {
      project: {
        create: jest.fn().mockResolvedValue(createdProject),
      },
      projectMember: {
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));
    prisma.project.findUniqueOrThrow.mockResolvedValue(createdProject);
    authorizationService.getProjectAdminRole.mockResolvedValue({ id: 'role-1' });
    documentsService.listDocuments.mockResolvedValue([]);

    const result = await service.createProject(
      { title: 'Metro Package' },
      'user-1',
    );

    expect(tx.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProjectStatus.TENDERING,
          tenderStages: {
            create: expect.arrayContaining([
              expect.objectContaining({
                stage: TenderStageType.SITE_VISIT,
                sequence: 2,
              }),
              expect.objectContaining({
                stage: TenderStageType.TENDER_RECEIVED,
                sequence: 1,
              }),
              expect.objectContaining({
                stage: TenderStageType.LOI_AWARDED,
                sequence: 8,
              }),
            ]),
          },
        }),
      }),
    );
    expect(result.tenderStages).toHaveLength(1);
  });

  it('blocks completing a later stage when an earlier stage is still pending', async () => {
    prisma.projectTenderStage.findFirstOrThrow.mockResolvedValue({
      id: 'stage-2',
      projectId: 'project-1',
      stage: TenderStageType.PREBID_QUERY,
      sequence: 2,
      status: TenderStageStatus.NOT_STARTED,
    });
    prisma.projectTenderStage.findFirst.mockResolvedValue({
      id: 'stage-1',
    });

    await expect(
      service.completeTenderStage('project-1', {
        stageId: 'stage-2',
      } as any),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.projectTenderStage.update).not.toHaveBeenCalled();
  });

  it('rejects attaching documents to a skipped stage', async () => {
    prisma.projectTenderStage.findFirstOrThrow.mockResolvedValue({
      id: 'stage-5',
      projectId: 'project-1',
      stage: TenderStageType.AUCTION,
      sequence: 5,
      status: TenderStageStatus.SKIPPED,
    });

    await expect(
      service.createTenderStageDocument('project-1', {
        stageId: 'stage-5',
        title: 'Auction note',
      }),
    ).rejects.toThrow('Documents cannot be attached to skipped tender stages.');
  });
});
