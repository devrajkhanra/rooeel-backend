import { AuthorizationService } from './authorization.service';
import { PermissionToken } from './permission-tokens';

describe('AuthorizationService', () => {
  const prisma = {
    permission: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    rolePermission: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    projectRole: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;

  let service: AuthorizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthorizationService(prisma);
  });

  it('falls back to another accessible project when the requested project is stale', async () => {
    prisma.projectMember.findUnique.mockResolvedValueOnce(null);
    prisma.projectMember.findMany.mockResolvedValue([
      {
        projectId: 'project-2',
        status: 'ACTIVE',
        role: {
          permissions: [
            {
              permission: {
                token: PermissionToken.ProjectRead,
              },
            },
          ],
        },
      },
    ]);

    const resolvedProjectId = await service.resolveAccessibleProjectId(
      'user-1',
      [PermissionToken.ProjectRead],
      'project-stale',
    );

    expect(resolvedProjectId).toBe('project-2');
  });
});
