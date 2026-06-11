import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../common/graphql-context';
import { ProjectId } from '../authorization/project-id.decorator';
import { ProjectPermissionGuard } from '../authorization/project-permission.guard';
import { RequirePermissions } from '../authorization/permissions.decorator';
import { PermissionToken } from '../authorization/permission-tokens';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.inputs';
import { ProjectModel } from './models/project.models';
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
}
