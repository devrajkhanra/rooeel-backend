import {
  ProjectModuleStatus,
  ProjectModuleType,
  ProjectStatus,
} from '@prisma/client';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const projectWithCount = {
    id: 'project-1',
    name: 'Metro Package',
    description: null,
    status: ProjectStatus.TENDERING,
    configuration: {
      id: 'config-1',
      projectId: 'project-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    modules: [
      {
        id: 'module-1',
        projectId: 'project-1',
        type: ProjectModuleType.TENDERING,
        name: 'Tendering',
        description: null,
        status: ProjectModuleStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    _count: { tenderStages: 8 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    $transaction: jest.fn(),
    project: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectMember: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    projectRole: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    projectConfiguration: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    projectModule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  const authorizationService = {
    createDefaultProjectRoles: jest.fn(),
    getProjectAdminRole: jest.fn(),
    userHasPermissions: jest.fn(),
  } as any;

  const tenderingService = {
    ensureLoiAwarded: jest.fn(),
  } as any;

  const audit = {
    record: jest.fn(),
  } as any;

  let service: ProjectsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ProjectsService(
      prisma,
      authorizationService,
      tenderingService,
      audit,
    );
  });

  it('seeds 8 tender stages when a project is created', async () => {
    const tx = {
      project: {
        create: jest
          .fn()
          .mockResolvedValue({ ...projectWithCount, id: 'project-1' }),
      },
      projectMember: { create: jest.fn() },
    };

    prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
    prisma.project.findUniqueOrThrow.mockResolvedValue(projectWithCount);
    authorizationService.getProjectAdminRole.mockResolvedValue({
      id: 'role-1',
    });

    const result = await service.createProject(
      { title: 'Metro Package' },
      'user-1',
    );

    expect(tx.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProjectStatus.TENDERING,
          modules: {
            create: expect.arrayContaining([
              expect.objectContaining({
                type: ProjectModuleType.TENDERING,
                name: 'Tendering',
              }),
            ]),
          },
          tenderStages: {
            create: expect.arrayContaining([
              expect.objectContaining({
                stage: 'TENDER_RECEIVED',
                sequence: 1,
              }),
              expect.objectContaining({ stage: 'SITE_VISIT', sequence: 2 }),
              expect.objectContaining({ stage: 'LOI_AWARDED', sequence: 8 }),
            ]),
          },
        }),
      }),
    );
    expect(result.tenderStageCount).toBe(8);
  });

  it('returns mapped project from listMyProjects', async () => {
    prisma.projectMember.findMany.mockResolvedValue([
      { projectId: 'project-1', project: projectWithCount },
    ]);
    authorizationService.createDefaultProjectRoles.mockResolvedValue(undefined);

    const results = await service.listMyProjects('user-1');
    expect(results).toHaveLength(1);
    expect(results[0].tenderStageCount).toBe(8);
    expect(results[0].modules).toEqual([
      expect.objectContaining({
        type: ProjectModuleType.TENDERING,
        name: 'Tendering',
      }),
    ]);
  });

  it('reactivates archived project modules on create', async () => {
    const archivedModule = {
      id: 'module-1',
      projectId: 'project-1',
      type: ProjectModuleType.TENDERING,
      name: 'Tendering',
      description: null,
      status: ProjectModuleStatus.ARCHIVED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const activeModule = {
      ...archivedModule,
      status: ProjectModuleStatus.ACTIVE,
    };
    prisma.projectModule.findUnique.mockResolvedValue(archivedModule);
    prisma.projectModule.update.mockResolvedValue(activeModule);

    const result = await service.createProjectModule(
      'project-1',
      { type: ProjectModuleType.TENDERING },
      'user-1',
    );

    expect(prisma.projectModule.update).toHaveBeenCalledWith({
      where: { id: 'module-1' },
      data: expect.objectContaining({
        name: 'Tendering',
        status: ProjectModuleStatus.ACTIVE,
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        entityType: 'ProjectModule',
        entityId: 'module-1',
        projectId: 'project-1',
        userId: 'user-1',
      }),
    );
    expect(result.status).toBe(ProjectModuleStatus.ACTIVE);
  });

  it('upserts project configuration after LOI is awarded', async () => {
    const configuration = {
      id: 'config-1',
      projectId: 'project-1',
      notes: 'Award setup',
      metadata: { package: 'civil' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tenderingService.ensureLoiAwarded.mockResolvedValue(undefined);
    prisma.projectConfiguration.upsert.mockResolvedValue(configuration);

    const result = await service.updateProjectConfiguration(
      'project-1',
      {
        notes: ' Award setup ',
        metadata: { package: 'civil' },
      },
      'user-1',
    );

    expect(tenderingService.ensureLoiAwarded).toHaveBeenCalledWith('project-1');
    expect(prisma.projectConfiguration.upsert).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      create: {
        projectId: 'project-1',
        notes: 'Award setup',
        metadata: { package: 'civil' },
      },
      update: {
        notes: 'Award setup',
        metadata: { package: 'civil' },
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        entityType: 'ProjectConfiguration',
        entityId: 'config-1',
        projectId: 'project-1',
        userId: 'user-1',
      }),
    );
    expect(result).toBe(configuration);
  });

  it('does not update project configuration before LOI is awarded', async () => {
    tenderingService.ensureLoiAwarded.mockRejectedValue(
      new Error('LOI not awarded'),
    );

    await expect(
      service.updateProjectConfiguration(
        'project-1',
        { notes: 'Blocked' },
        'user-1',
      ),
    ).rejects.toThrow('LOI not awarded');

    expect(prisma.projectConfiguration.upsert).not.toHaveBeenCalled();
  });
});
