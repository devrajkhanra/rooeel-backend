import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { ProjectId } from '../authorization/project-id.decorator';
import { ProjectPermissionGuard } from '../authorization/project-permission.guard';
import { RequirePermissions } from '../authorization/permissions.decorator';
import { PermissionToken } from '../authorization/permission-tokens';
import { DocumentModel } from '../documents/models/document.models';
import {
  CreateTenderStageDocumentInput,
  CreateTenderStageEventDocumentInput,
  CreateTenderStageEventInput,
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
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.tenderingService.startTenderStage(projectId, input);
  }

  @Mutation(() => TenderStageModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  completeTenderStage(
    @ProjectId() projectId: string,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.tenderingService.completeTenderStage(projectId, input);
  }

  @Mutation(() => TenderStageModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  skipTenderStage(
    @ProjectId() projectId: string,
    @Args('input') input: UpdateTenderStageInput,
  ) {
    return this.tenderingService.skipTenderStage(projectId, input);
  }

  @Mutation(() => DocumentModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  createTenderStageDocument(
    @ProjectId() projectId: string,
    @Args('input') input: CreateTenderStageDocumentInput,
  ) {
    return this.tenderingService.createTenderStageDocument(projectId, input);
  }

  @Mutation(() => TenderStageEventModel)
  @RequirePermissions(PermissionToken.ProjectConfigure)
  createTenderStageEvent(
    @ProjectId() projectId: string,
    @Args('input') input: CreateTenderStageEventInput,
  ) {
    return this.tenderingService.createTenderStageEvent(projectId, input);
  }

  @Mutation(() => DocumentModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  createTenderStageEventDocument(
    @ProjectId() projectId: string,
    @Args('input') input: CreateTenderStageEventDocumentInput,
  ) {
    return this.tenderingService.createTenderStageEventDocument(projectId, input);
  }
}
