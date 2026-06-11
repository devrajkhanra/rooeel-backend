import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../common/graphql-context';
import { ProjectId } from '../authorization/project-id.decorator';
import { ProjectPermissionGuard } from '../authorization/project-permission.guard';
import { RequirePermissions } from '../authorization/permissions.decorator';
import { PermissionToken } from '../authorization/permission-tokens';
import {
  CreateTenderStageEventDocumentInput,
  CreateTenderStageEventInput,
  CreateTenderStageDocumentInput,
  CreateProjectInput,
  UpdateProjectInput,
  UpdateTenderStageInput,
} from './dto/project.inputs';
import {
  ProjectModel,
  ProjectTenderStageEventModel,
  ProjectTenderStageModel,
} from './models/project.models';
import { DocumentModel } from '../documents/models/document.models';
import { ProjectsService } from './projects.service';

@Resolver(() => ProjectModel)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Mutation(() => ProjectModel)
  @UseGuards(AuthGuard)
  createProject(
    @Args('input') input: CreateProjectInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.createProject(input, user.sub);
  }

  @Query(() => [ProjectModel])
  @UseGuards(AuthGuard)
  myProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.listMyProjects(user.sub);
  }

  @Query(() => ProjectModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectRead)
  activeProject(@ProjectId() projectId: string) {
    return this.projectsService.getProject(projectId);
  }

  @Mutation(() => ProjectModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  updateProject(
    @ProjectId() projectId: string,
    @Args('input') input: UpdateProjectInput,
  ) {
    return this.projectsService.updateProject(projectId, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  deleteProject(@ProjectId() projectId: string) {
    return this.projectsService.deleteProject(projectId);
  }

  @Query(() => [ProjectTenderStageModel])
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectRead)
  tenderStages(@ProjectId() projectId: string) {
    return this.projectsService.listTenderStages(projectId);
  }

  @Query(() => ProjectTenderStageModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectRead)
  tenderStage(
    @ProjectId() projectId: string,
    @Args('stageId') stageId: string,
  ) {
    return this.projectsService.getTenderStage(projectId, stageId);
  }

  @Mutation(() => ProjectTenderStageModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  startTenderStage(
    @ProjectId() projectId: string,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.projectsService.startTenderStage(projectId, input);
  }

  @Mutation(() => ProjectTenderStageModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  completeTenderStage(
    @ProjectId() projectId: string,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.projectsService.completeTenderStage(projectId, input);
  }

  @Mutation(() => ProjectTenderStageModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  skipTenderStage(
    @ProjectId() projectId: string,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.projectsService.skipTenderStage(projectId, input);
  }

  @Mutation(() => DocumentModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.DocumentManage)
  createTenderStageDocument(
    @ProjectId() projectId: string,
    @Args('input') input: CreateTenderStageDocumentInput,
  ) {
    return this.projectsService.createTenderStageDocument(projectId, input);
  }

  @Mutation(() => ProjectTenderStageEventModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  createTenderStageEvent(
    @ProjectId() projectId: string,
    @Args('input') input: CreateTenderStageEventInput,
  ) {
    return this.projectsService.createTenderStageEvent(projectId, input);
  }

  @Mutation(() => DocumentModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.DocumentManage)
  createTenderStageEventDocument(
    @ProjectId() projectId: string,
    @Args('input') input: CreateTenderStageEventDocumentInput,
  ) {
    return this.projectsService.createTenderStageEventDocument(projectId, input);
  }

}
