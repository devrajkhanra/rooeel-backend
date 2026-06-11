import { ProjectStatus } from '@prisma/client';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const projectWithCount = {
    id: 'project-1',
    name: 'Metro Package',
    description: null,
    status: ProjectStatus.TENDERING,
    configuration: { id: 'config-1', projectId: 'project-1', createdAt: new Date(), updatedAt: new Date() },
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
  } as any;

  const authorizationService = {
    createDefaultProjectRoles: jest.fn(),
    getProjectAdminRole: jest.fn(),
    userHasPermissions: jest.fn(),
  } as any;

  let service: ProjectsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(prisma, authorizationService);
  });

  it('seeds 8 tender stages when a project is created', async () => {
    const tx = {
      project: {
        create: jest.fn().mockResolvedValue({ ...projectWithCount, id: 'project-1' }),
      },
      projectMember: { create: jest.fn() },
    };

    prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
    prisma.project.findUniqueOrThrow.mockResolvedValue(projectWithCount);
    authorizationService.getProjectAdminRole.mockResolvedValue({ id: 'role-1' });

    const result = await service.createProject({ title: 'Metro Package' }, 'user-1');

    expect(tx.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProjectStatus.TENDERING,
          tenderStages: {
            create: expect.arrayContaining([
              expect.objectContaining({ stage: 'TENDER_RECEIVED', sequence: 1 }),
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
  });
});
