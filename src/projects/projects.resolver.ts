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
  CreateProjectInput,
  CreateProjectModuleInput,
  UpdateProjectConfigurationInput,
  UpdateProjectModuleInput,
  UpdateProjectInput,
} from './dto/project.inputs';
import {
  ProjectConfigurationModel,
  ProjectModuleModel,
  ProjectModel,
} from './models/project.models';
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

  @Query(() => [ProjectModuleModel])
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectRead)
  projectModules(
    @ProjectId() projectId: string,
    @Args('includeArchived', { nullable: true }) includeArchived?: boolean,
  ) {
    return this.projectsService.listProjectModules(projectId, includeArchived);
  }

  @Query(() => ProjectModuleModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectRead)
  projectModule(
    @ProjectId() projectId: string,
    @Args('moduleId') moduleId: string,
  ) {
    return this.projectsService.getProjectModule(projectId, moduleId);
  }

  @Mutation(() => ProjectModuleModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  createProjectModule(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateProjectModuleInput,
  ) {
    return this.projectsService.createProjectModule(projectId, input, user.sub);
  }

  @Mutation(() => ProjectModuleModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  updateProjectModule(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateProjectModuleInput,
  ) {
    return this.projectsService.updateProjectModule(projectId, input, user.sub);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  deleteProjectModule(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('moduleId') moduleId: string,
  ) {
    return this.projectsService.deleteProjectModule(
      projectId,
      moduleId,
      user.sub,
    );
  }

  @Mutation(() => ProjectConfigurationModel)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  updateProjectConfiguration(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateProjectConfigurationInput,
  ) {
    return this.projectsService.updateProjectConfiguration(
      projectId,
      input,
      user.sub,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard, ProjectPermissionGuard)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  deleteProjectConfiguration(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.deleteProjectConfiguration(projectId, user.sub);
  }
}
