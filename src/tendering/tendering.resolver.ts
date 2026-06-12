import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../common/graphql-context';
import { ProjectId } from '../authorization/project-id.decorator';
import { ProjectPermissionGuard } from '../authorization/project-permission.guard';
import { RequirePermissions } from '../authorization/permissions.decorator';
import { PermissionToken } from '../authorization/permission-tokens';
import { DocumentModel } from '../documents/models/document.models';
import {
  CreateTenderStageDocumentInput,
  CreateTenderStageEventDocumentInput,
  CreateTenderStageEventInput,
  DeleteTenderStageEventInput,
  UpdateTenderStageEventInput,
  UpdateTenderStageInput,
} from './dto/tendering.inputs';
import { TenderStageEventModel, TenderStageModel } from './models/tendering.models';
import { TenderingService } from './tendering.service';

@Resolver(() => TenderStageModel)
@UseGuards(AuthGuard, ProjectPermissionGuard)
export class TenderingResolver {
  constructor(private readonly tenderingService: TenderingService) {}

  @Query(() => [TenderStageModel])
  @RequirePermissions(PermissionToken.ProjectRead)
  tenderStages(@ProjectId() projectId: string) {
    return this.tenderingService.listTenderStages(projectId);
  }

  @Query(() => TenderStageModel)
  @RequirePermissions(PermissionToken.ProjectRead)
  tenderStage(
    @ProjectId() projectId: string,
    @Args('stageId') stageId: string,
  ) {
    return this.tenderingService.getTenderStage(projectId, stageId);
  }

  @Mutation(() => TenderStageModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  startTenderStage(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.tenderingService.startTenderStage(projectId, input, user.sub);
  }

  @Mutation(() => TenderStageModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  completeTenderStage(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.tenderingService.completeTenderStage(projectId, input, user.sub);
  }

  @Mutation(() => TenderStageModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  skipTenderStage(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.tenderingService.skipTenderStage(projectId, input, user.sub);
  }

  @Mutation(() => DocumentModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  createTenderStageDocument(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateTenderStageDocumentInput,
  ) {
    return this.tenderingService.createTenderStageDocument(projectId, input, user.sub);
  }

  @Mutation(() => TenderStageEventModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  createTenderStageEvent(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateTenderStageEventInput,
  ) {
    return this.tenderingService.createTenderStageEvent(projectId, input, user.sub);
  }

  @Mutation(() => TenderStageEventModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  updateTenderStageEvent(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateTenderStageEventInput,
  ) {
    return this.tenderingService.updateTenderStageEvent(projectId, input, user.sub);
  }

  @Mutation(() => Boolean)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  deleteTenderStageEvent(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: DeleteTenderStageEventInput,
  ) {
    return this.tenderingService.deleteTenderStageEvent(projectId, input, user.sub);
  }

  @Mutation(() => DocumentModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  createTenderStageEventDocument(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: CreateTenderStageEventDocumentInput,
  ) {
    return this.tenderingService.createTenderStageEventDocument(projectId, input, user.sub);
  }
}