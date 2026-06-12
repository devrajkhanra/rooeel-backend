import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AuditAction,
  Prisma,
  ProjectModuleStatus,
  ProjectModuleType,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { AuditService } from '../audit/audit.service';
import { TenderingService } from '../tendering/tendering.service';
import {
  CreateProjectInput,
  CreateProjectModuleInput,
  UpdateProjectConfigurationInput,
  UpdateProjectModuleInput,
  UpdateProjectInput,
} from './dto/project.inputs';

const TENDER_STAGE_DEFINITIONS: Array<{
  stage: Prisma.ProjectTenderStageCreateManyProjectInput['stage'];
  sequence: number;
}> = [
  { stage: 'TENDER_RECEIVED', sequence: 1 },
  { stage: 'SITE_VISIT', sequence: 2 },
  { stage: 'PREBID_QUERY', sequence: 3 },
  { stage: 'TENDER_SUBMISSION', sequence: 4 },
  { stage: 'CLARIFICATION', sequence: 5 },
  { stage: 'AUCTION', sequence: 6 },
  { stage: 'NEGOTIATION', sequence: 7 },
  { stage: 'LOI_AWARDED', sequence: 8 },
];

type ProjectConfigurationWritableData = {
  notes?: string | null;
  metadata?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
};

const DEFAULT_PROJECT_MODULES: Array<{
  type: ProjectModuleType;
  name: string;
  description: string;
}> = [
  {
    type: ProjectModuleType.TENDERING,
    name: 'Tendering',
    description: 'Tendering workflow from tender receipt through LOI award.',
  },
];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly tenderingService: TenderingService,
    private readonly audit: AuditService,
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
          modules: {
            create: DEFAULT_PROJECT_MODULES,
          },
          tenderStages: {
            create: TENDER_STAGE_DEFINITIONS.map((def) => ({
              stage: def.stage,
              sequence: def.sequence,
            })),
          },
        },
        include: {
          configuration: true,
          modules: true,
          _count: { select: { tenderStages: true } },
        },
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
    const membershipRefs = await this.prisma.projectMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { projectId: true },
      orderBy: { createdAt: 'asc' },
    });

    const projectIds = [...new Set(membershipRefs.map((m) => m.projectId))];
    for (const projectId of projectIds) {
      await this.authorizationService.createDefaultProjectRoles(projectId);
      await this.ensureDefaultProjectModules(projectId);
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        project: {
          include: {
            configuration: true,
            modules: true,
            _count: { select: { tenderStages: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => this.mapProject(m.project));
  }

  async getProject(projectId: string) {
    await this.ensureDefaultProjectModules(projectId);

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        configuration: true,
        modules: true,
        _count: { select: { tenderStages: true } },
      },
    });

    return this.mapProject(project);
  }

  async updateProject(projectId: string, input: UpdateProjectInput) {
    if (input.projectId !== projectId) {
      throw new BadRequestException(
        'Project id does not match active project.',
      );
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.title.trim(),
        description: input.description?.trim() || null,
      },
      include: {
        configuration: true,
        modules: true,
        _count: { select: { tenderStages: true } },
      },
    });

    return this.mapProject(project);
  }

  async deleteProject(projectId: string) {
    await this.prisma.project.delete({ where: { id: projectId } });
    return true;
  }

  async listProjectModules(projectId: string, includeArchived = false) {
    return this.prisma.projectModule.findMany({
      where: {
        projectId,
        status: includeArchived ? undefined : ProjectModuleStatus.ACTIVE,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getProjectModule(projectId: string, moduleId: string) {
    const module = await this.prisma.projectModule.findFirstOrThrow({
      where: { id: moduleId, projectId },
    });

    return this.mapProjectModule(module);
  }

  async createProjectModule(
    projectId: string,
    input: CreateProjectModuleInput,
    actorUserId?: string,
  ) {
    const existing = await this.prisma.projectModule.findUnique({
      where: {
        projectId_type: {
          projectId,
          type: input.type,
        },
      },
    });

    const defaults = this.projectModuleDefaults(input.type);
    const data = {
      name: input.name?.trim() || defaults.name,
      description: input.description?.trim() || defaults.description,
      status: ProjectModuleStatus.ACTIVE,
    };

    const module = existing
      ? await this.prisma.projectModule.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.projectModule.create({
          data: {
            projectId,
            type: input.type,
            ...data,
          },
        });

    this.audit.record({
      action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: 'ProjectModule',
      entityId: module.id,
      projectId,
      userId: actorUserId,
      metadata: { type: module.type, status: module.status },
    });

    return this.mapProjectModule(module);
  }

  async updateProjectModule(
    projectId: string,
    input: UpdateProjectModuleInput,
    actorUserId?: string,
  ) {
    await this.getProjectModule(projectId, input.moduleId);

    const module = await this.prisma.projectModule.update({
      where: { id: input.moduleId },
      data: {
        name: input.name?.trim(),
        description:
          input.description !== undefined
            ? input.description.trim() || null
            : undefined,
      },
    });

    this.audit.record({
      action: AuditAction.UPDATE,
      entityType: 'ProjectModule',
      entityId: module.id,
      projectId,
      userId: actorUserId,
      metadata: { type: module.type },
    });

    return this.mapProjectModule(module);
  }

  async deleteProjectModule(
    projectId: string,
    moduleId: string,
    actorUserId?: string,
  ) {
    await this.getProjectModule(projectId, moduleId);

    const module = await this.prisma.projectModule.update({
      where: { id: moduleId },
      data: { status: ProjectModuleStatus.ARCHIVED },
    });

    this.audit.record({
      action: AuditAction.DELETE,
      entityType: 'ProjectModule',
      entityId: module.id,
      projectId,
      userId: actorUserId,
      metadata: { type: module.type, status: module.status },
    });

    return true;
  }

  async updateProjectConfiguration(
    projectId: string,
    input: UpdateProjectConfigurationInput,
    actorUserId?: string,
  ) {
    await this.tenderingService.ensureLoiAwarded(projectId);

    const data = this.buildProjectConfigurationData(input);
    const configuration = await this.prisma.projectConfiguration.upsert({
      where: { projectId },
      create: {
        projectId,
        ...data,
      },
      update: data,
    });

    this.audit.record({
      action: AuditAction.UPDATE,
      entityType: 'ProjectConfiguration',
      entityId: configuration.id,
      projectId,
      userId: actorUserId,
    });

    return configuration;
  }

  async deleteProjectConfiguration(projectId: string, actorUserId?: string) {
    await this.tenderingService.ensureLoiAwarded(projectId);

    const result = await this.prisma.projectConfiguration.deleteMany({
      where: { projectId },
    });

    this.audit.record({
      action: AuditAction.DELETE,
      entityType: 'ProjectConfiguration',
      entityId: projectId,
      projectId,
      userId: actorUserId,
      metadata: { deletedCount: result.count },
    });

    return true;
  }

  private buildProjectConfigurationData(
    input: UpdateProjectConfigurationInput,
  ): ProjectConfigurationWritableData {
    const data: ProjectConfigurationWritableData = {};

    if (input.notes !== undefined) {
      data.notes = input.notes?.trim() || null;
    }

    if (input.metadata !== undefined) {
      data.metadata =
        input.metadata === null
          ? Prisma.JsonNull
          : (input.metadata as Prisma.InputJsonValue);
    }

    return data;
  }

  private mapProject(
    project: Prisma.ProjectGetPayload<{
      include: {
        configuration: true;
        modules: true;
        _count: { select: { tenderStages: true } };
      };
    }>,
  ) {
    return {
      ...project,
      description: project.description ?? undefined,
      modules: project.modules.map((module) => this.mapProjectModule(module)),
      tenderStageCount: project._count.tenderStages,
    };
  }

  private mapProjectModule(module: {
    id: string;
    projectId: string;
    type: ProjectModuleType;
    name: string;
    description: string | null;
    status: ProjectModuleStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...module,
      description: module.description ?? undefined,
    };
  }

  private projectModuleDefaults(type: ProjectModuleType) {
    const defaults = DEFAULT_PROJECT_MODULES.find(
      (module) => module.type === type,
    );

    if (!defaults) {
      throw new BadRequestException(
        `${type} is not a supported project module.`,
      );
    }

    return defaults;
  }

  private async ensureDefaultProjectModules(
    projectId: string,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    for (const module of DEFAULT_PROJECT_MODULES) {
      const existing = await db.projectModule.findUnique({
        where: {
          projectId_type: {
            projectId,
            type: module.type,
          },
        },
        select: { id: true },
      });

      if (!existing) {
        await db.projectModule.create({
          data: {
            projectId,
            type: module.type,
            name: module.name,
            description: module.description,
            status: ProjectModuleStatus.ACTIVE,
          },
        });
      }
    }
  }
}
