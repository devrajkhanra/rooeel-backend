import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PermissionToken } from '../authorization/permission-tokens';
import { RequirePermissions } from '../authorization/permissions.decorator';
import { ProjectId } from '../authorization/project-id.decorator';
import { ProjectPermissionGuard } from '../authorization/project-permission.guard';
import type { AuthenticatedUser } from '../common/graphql-context';
import {
  ConfirmAttachmentUploadInput,
  DeleteAttachmentInput,
  RenameAttachmentInput,
  RequestAttachmentUploadInput,
  UpdateDocumentInput,
} from './dto/document.inputs';
import {
  DocumentAttachmentModel,
  DocumentModel,
  PresignedDownloadModel,
  PresignedUploadModel,
} from './models/document.models';
import { DocumentsService } from './documents.service';

@Resolver()
@UseGuards(AuthGuard, ProjectPermissionGuard)
export class DocumentsResolver {
  constructor(private readonly documentsService: DocumentsService) {}

  @Mutation(() => PresignedUploadModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  requestAttachmentUpload(
    @ProjectId() projectId: string,
    @Args('input') input: RequestAttachmentUploadInput,
  ) {
    return this.documentsService.requestAttachmentUpload(projectId, input);
  }

  @Mutation(() => DocumentAttachmentModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  confirmAttachmentUpload(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: ConfirmAttachmentUploadInput,
  ) {
    return this.documentsService.confirmAttachmentUpload(
      projectId,
      user.sub,
      input,
    );
  }

  @Mutation(() => DocumentAttachmentModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  renameAttachment(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: RenameAttachmentInput,
  ) {
    return this.documentsService.renameAttachment(projectId, user.sub, input);
  }

  @Mutation(() => Boolean)
  @RequirePermissions(PermissionToken.DocumentManage)
  deleteAttachment(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: DeleteAttachmentInput,
  ) {
    return this.documentsService.deleteAttachment(projectId, user.sub, input);
  }

  @Query(() => PresignedDownloadModel)
  @RequirePermissions(PermissionToken.DocumentRead)
  attachmentDownloadUrl(
    @ProjectId() projectId: string,
    @Args('attachmentId') attachmentId: string,
  ) {
    return this.documentsService.getAttachmentDownloadUrl(
      projectId,
      attachmentId,
    );
  }

  @Mutation(() => DocumentModel)
  @RequirePermissions(PermissionToken.DocumentManage)
  updateDocument(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('input') input: UpdateDocumentInput,
  ) {
    return this.documentsService.updateDocument(projectId, input, user.sub);
  }

  @Mutation(() => Boolean)
  @RequirePermissions(PermissionToken.DocumentManage)
  deleteDocument(
    @ProjectId() projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Args('documentId') documentId: string,
  ) {
    return this.documentsService.deleteDocument(
      projectId,
      documentId,
      user.sub,
    );
  }
}
