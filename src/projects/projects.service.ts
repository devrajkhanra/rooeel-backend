import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.inputs';

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

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
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
            create: TENDER_STAGE_DEFINITIONS.map((def) => ({
              stage: def.stage,
              sequence: def.sequence,
            })),
          },
        },
        include: { configuration: true, _count: { select: { tenderStages: true } } },
      });

      await this.authorizationService.createDefaultProjectRoles(project.id, tx);
      const adminRole = await this.authorizationService.getProjectAdminRole(project.id, tx);

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
      where: { userId, status: 'ACTIVE' },
      include: {
        project: {
          include: {
            configuration: true,
            _count: { select: { tenderStages: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const projectIds = [...new Set(memberships.map((m) => m.projectId))];
    for (const projectId of projectIds) {
      await this.authorizationService.createDefaultProjectRoles(projectId);
    }

    return memberships.map((m) => this.mapProject(m.project));
  }

  async getProject(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        configuration: true,
        _count: { select: { tenderStages: true } },
      },
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
      include: {
        configuration: true,
        _count: { select: { tenderStages: true } },
      },
    });

    return this.mapProject(project);
  }

  async deleteProject(projectId: string) {
    await this.prisma.project.delete({ where: { id: projectId } });
    return true;
  }

  private mapProject(
    project: Prisma.ProjectGetPayload<{
      include: { configuration: true; _count: { select: { tenderStages: true } } };
    }>,
  ) {
    return {
      ...project,
      description: project.description ?? undefined,
      tenderStageCount: project._count.tenderStages,
    };
  }
}
