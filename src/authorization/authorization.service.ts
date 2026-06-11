import { Injectable } from '@nestjs/common';
import { Prisma, type ProjectRole } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import {
  DEFAULT_PROJECT_ROLES,
  PermissionToken,
  PermissionTokenValue,
  SYSTEM_PERMISSIONS,
} from './permission-tokens';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSystemPermissions(
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    await Promise.all(
      SYSTEM_PERMISSIONS.map((permission) =>
        db.permission.upsert({
          where: { token: permission.token },
          create: permission,
          update: { description: permission.description },
        }),
      ),
    );
  }

  async createDefaultProjectRoles(
    projectId: string,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    await this.ensureSystemPermissions(db);

    const roles: ProjectRole[] = [];
    for (const roleDefinition of DEFAULT_PROJECT_ROLES) {
      const role = await db.projectRole.upsert({
        where: {
          projectId_name: {
            projectId,
            name: roleDefinition.name,
          },
        },
        create: {
          projectId,
          name: roleDefinition.name,
          description: roleDefinition.description,
          isSystem: true,
        },
        update: {
          description: roleDefinition.description,
        },
      });

      await this.setRolePermissions(
        role.id,
        [...roleDefinition.permissions],
        db,
      );
      roles.push(role);
    }

    return roles;
  }

  async setRolePermissions(
    roleId: string,
    permissionTokens: string[],
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    await this.ensureSystemPermissions(db);

    const permissions = await db.permission.findMany({
      where: { token: { in: permissionTokens } },
    });

    await db.rolePermission.deleteMany({ where: { roleId } });

    await db.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  async getProjectAdminRole(
    projectId: string,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const role = await db.projectRole.findUnique({
      where: {
        projectId_name: {
          projectId,
          name: 'Project Admin',
        },
      },
    });

    return role ?? (await this.createDefaultProjectRoles(projectId, db))[0];
  }

  async userHasPermissions(
    userId: string,
    projectId: string,
    requiredPermissions: PermissionTokenValue[],
  ) {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const membership = await this.findActiveMembershipWithPermissions(
      userId,
      projectId,
    );

    if (!membership) {
      return false;
    }

    if (this.membershipHasPermissions(membership, requiredPermissions)) {
      return true;
    }

    await this.createDefaultProjectRoles(projectId);

    const repairedMembership = await this.findActiveMembershipWithPermissions(
      userId,
      projectId,
    );

    return repairedMembership
      ? this.membershipHasPermissions(repairedMembership, requiredPermissions)
      : false;
  }

  async resolveAccessibleProjectId(
    userId: string,
    requiredPermissions: PermissionTokenValue[],
    requestedProjectId?: string,
  ) {
    if (requestedProjectId) {
      const requestedAllowed = await this.userHasPermissions(
        userId,
        requestedProjectId,
        requiredPermissions,
      );

      if (requestedAllowed) {
        return requestedProjectId;
      }
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const matchingMembership = memberships.find((membership) =>
      this.membershipHasPermissions(membership, requiredPermissions),
    );

    return matchingMembership?.projectId;
  }

  private async findActiveMembershipWithPermissions(
    userId: string,
    projectId: string,
  ) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return null;
    }

    return membership;
  }

  private membershipHasPermissions(
    membership: NonNullable<
      Awaited<ReturnType<AuthorizationService['findActiveMembershipWithPermissions']>>
    >,
    requiredPermissions: PermissionTokenValue[],
  ) {
    const granted = new Set(
      membership.role.permissions.map((entry) => entry.permission.token),
    );

    return requiredPermissions.every((permission) => granted.has(permission));
  }

  async listPermissions() {
    await this.ensureSystemPermissions();
    return this.prisma.permission.findMany({ orderBy: { token: 'asc' } });
  }

  get coreProjectReadPermission() {
    return PermissionToken.ProjectRead;
  }
}
