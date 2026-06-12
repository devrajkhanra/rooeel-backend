import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, DocumentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../core/prisma/prisma.service';
import { StorageService } from '../core/storage/storage.service';
import { AuditService } from '../audit/audit.service';
import {
  ConfirmAttachmentUploadInput,
  CreateDocumentInput,
  DeleteAttachmentInput,
  RenameAttachmentInput,
  RequestAttachmentUploadInput,
  UpdateDocumentInput,
} from './dto/document.inputs';

const documentInclude = {
  attachments: {
    orderBy: [{ uploadedAt: 'desc' as const }],
  },
};

const PROJECT_DOCUMENT_OWNER_TYPE = 'PROJECT';
const TENDER_STAGE_DOCUMENT_OWNER_TYPE = 'PROJECT_TENDER_STAGE';

const MAX_FILENAME_LENGTH = 200;
const SANITIZE_PATTERN = /[\\/]/g;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async createDocument(
    projectId: string,
    input: CreateDocumentInput,
    actorUserId?: string,
  ) {
    const ownerType = this.normalizeOwnerType(input.ownerType);
    await this.ensureOwnerBelongsToProject(projectId, ownerType, input.ownerId);
    const documentDate = input.documentDate
      ? this.parseDocumentDate(input.documentDate)
      : null;

    const document = await this.prisma.document.create({
      data: {
        projectId,
        ownerType,
        ownerId: input.ownerId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        documentDate,
      },
      include: documentInclude,
    });

    this.audit.record({
      action: AuditAction.CREATE,
      entityType: 'Document',
      entityId: document.id,
      projectId,
      userId: actorUserId,
      metadata: { ownerType, ownerId: input.ownerId, title: document.title },
    });

    return document;
  }

  async listDocuments(
    projectId: string,
    ownerType?: string,
    ownerId?: string,
    take?: number,
    cursor?: string,
  ) {
    return this.prisma.document.findMany({
      where: {
        projectId,
        ownerType: ownerType ? this.normalizeOwnerType(ownerType) : undefined,
        ownerId,
        status: 'ACTIVE',
      },
      include: documentInclude,
      orderBy: [{ createdAt: 'desc' }],
      ...(take ? { take } : {}),
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  /**
   * Bulk fetch documents for a set of owner ids in a single query.
   * Used by TenderingService to avoid loading every document in the
   * project when only specific stage/event owners are needed.
   */
  async listDocumentsForOwners(
    projectId: string,
    ownerType: string,
    ownerIds: string[],
  ) {
    if (ownerIds.length === 0) return [];

    return this.prisma.document.findMany({
      where: {
        projectId,
        ownerType: this.normalizeOwnerType(ownerType),
        ownerId: { in: ownerIds },
        status: 'ACTIVE',
      },
      include: documentInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async updateDocument(
    projectId: string,
    input: UpdateDocumentInput,
    actorUserId?: string,
  ) {
    await this.ensureDocumentBelongsToProject(projectId, input.documentId);
    const documentDate = input.documentDate
      ? this.parseDocumentDate(input.documentDate)
      : null;

    const document = await this.prisma.document.update({
      where: { id: input.documentId },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        documentDate,
      },
      include: documentInclude,
    });

    this.audit.record({
      action: AuditAction.UPDATE,
      entityType: 'Document',
      entityId: document.id,
      projectId,
      userId: actorUserId,
    });

    return document;
  }

  async deleteDocument(projectId: string, documentId: string, actorUserId?: string) {
    const document = await this.ensureDocumentBelongsToProject(projectId, documentId);

    // Soft-delete first so the record disappears from listings immediately
    // and is never returned mid-cleanup.
    await this.prisma.document.update({
      where: { id: document.id },
      data: { status: DocumentStatus.ARCHIVED },
    });

    // Best-effort object storage cleanup. Failures are logged via audit
    // metadata but do not roll back the soft delete — a background sweep
    // can reconcile orphaned objects keyed off ARCHIVED documents.
    for (const attachment of document.attachments) {
      try {
        await this.storage.removeObject(attachment.objectKey);
      } catch {
        this.audit.record({
          action: AuditAction.ATTACHMENT_DELETE,
          entityType: 'DocumentAttachment',
          entityId: attachment.id,
          projectId,
          userId: actorUserId,
          metadata: { objectKey: attachment.objectKey, cleanupFailed: true },
        });
      }
    }

    this.audit.record({
      action: AuditAction.DELETE,
      entityType: 'Document',
      entityId: document.id,
      projectId,
      userId: actorUserId,
    });

    return true;
  }

  async requestAttachmentUpload(
    projectId: string,
    input: RequestAttachmentUploadInput,
  ) {
    await this.ensureDocumentBelongsToProject(projectId, input.documentId);

    const objectKey = this.buildObjectKey(
      projectId,
      input.documentId,
      input.fileName,
    );
    const expiresInSeconds = 10 * 60;
    const uploadUrl = await this.storage.presignedPutObject(
      objectKey,
      expiresInSeconds,
    );

    return {
      objectKey,
      uploadUrl,
      expiresInSeconds,
    };
  }

  async confirmAttachmentUpload(
    projectId: string,
    uploadedById: string,
    input: ConfirmAttachmentUploadInput,
  ) {
    await this.ensureDocumentBelongsToProject(projectId, input.documentId);

    if (!input.objectKey.startsWith(`projects/${projectId}/documents/`)) {
      throw new BadRequestException(
        'Object key does not belong to this project.',
      );
    }

    const attachment = await this.prisma.documentAttachment.create({
      data: {
        projectId,
        documentId: input.documentId,
        objectKey: input.objectKey,
        fileName: this.sanitizeFileName(input.fileName),
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        uploadedById,
      },
    });

    this.audit.record({
      action: AuditAction.ATTACHMENT_UPLOAD,
      entityType: 'DocumentAttachment',
      entityId: attachment.id,
      projectId,
      userId: uploadedById,
      metadata: { documentId: input.documentId, fileName: attachment.fileName },
    });

    return attachment;
  }

  async renameAttachment(
    projectId: string,
    actorUserId: string,
    input: RenameAttachmentInput,
  ) {
    const attachment = await this.prisma.documentAttachment.findFirst({
      where: { id: input.attachmentId, projectId },
    });

    if (!attachment) {
      throw new NotFoundException(
        'Document attachment does not belong to this project.',
      );
    }

    const fileName = this.sanitizeFileName(input.fileName);
    if (!fileName) {
      throw new BadRequestException('A valid file name is required.');
    }

    const updated = await this.prisma.documentAttachment.update({
      where: { id: attachment.id },
      data: { fileName },
    });

    this.audit.record({
      action: AuditAction.ATTACHMENT_RENAME,
      entityType: 'DocumentAttachment',
      entityId: updated.id,
      projectId,
      userId: actorUserId,
      metadata: { from: attachment.fileName, to: updated.fileName },
    });

    return updated;
  }

  async deleteAttachment(
    projectId: string,
    actorUserId: string,
    input: DeleteAttachmentInput,
  ) {
    const attachment = await this.prisma.documentAttachment.findFirst({
      where: { id: input.attachmentId, projectId },
    });

    if (!attachment) {
      throw new NotFoundException(
        'Document attachment does not belong to this project.',
      );
    }

    await this.prisma.documentAttachment.delete({ where: { id: attachment.id } });

    try {
      await this.storage.removeObject(attachment.objectKey);
    } catch {
      // Object cleanup best-effort; row is already gone, log via audit metadata.
    }

    this.audit.record({
      action: AuditAction.ATTACHMENT_DELETE,
      entityType: 'DocumentAttachment',
      entityId: attachment.id,
      projectId,
      userId: actorUserId,
      metadata: { documentId: attachment.documentId, fileName: attachment.fileName },
    });

    return true;
  }

  async getAttachmentDownloadUrl(projectId: string, attachmentId: string) {
    const attachment = await this.prisma.documentAttachment.findFirst({
      where: { id: attachmentId, projectId },
    });

    if (!attachment) {
      throw new BadRequestException(
        'Document attachment does not belong to this project.',
      );
    }

    const expiresInSeconds = 10 * 60;
    const downloadUrl = await this.storage.presignedGetObject(
      attachment.objectKey,
      expiresInSeconds,
    );

    return {
      downloadUrl,
      expiresInSeconds,
    };
  }

  private async ensureDocumentBelongsToProject(
    projectId: string,
    documentId: string,
  ) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, status: 'ACTIVE' },
      include: documentInclude,
    });

    if (!document) {
      throw new BadRequestException(
        'Document does not belong to this project.',
      );
    }

    return document;
  }

  private async ensureOwnerBelongsToProject(
    projectId: string,
    ownerType: string,
    ownerId: string,
  ) {
    if (ownerType === PROJECT_DOCUMENT_OWNER_TYPE) {
      if (ownerId !== projectId) {
        throw new BadRequestException(
          'Project documents must use the current project id as ownerId.',
        );
      }

      await this.prisma.project.findUniqueOrThrow({
        where: { id: projectId },
      });
      return;
    }

    if (ownerType === TENDER_STAGE_DOCUMENT_OWNER_TYPE) {
      await this.prisma.projectTenderStage.findFirstOrThrow({
        where: { id: ownerId, projectId },
      });
      return;
    }

    if (ownerType === 'PROJECT_TENDER_STAGE_EVENT') {
      await this.prisma.projectTenderStageEvent.findFirstOrThrow({
        where: { id: ownerId, projectId },
      });
      return;
    }

    throw new BadRequestException('Unsupported document owner type.');
  }

  private buildObjectKey(
    projectId: string,
    documentId: string,
    fileName: string,
  ) {
    const sanitizedFileName = fileName
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 120);

    return `projects/${projectId}/documents/${documentId}/${randomUUID()}-${sanitizedFileName}`;
  }

  private sanitizeFileName(fileName: string) {
    return fileName.trim().replace(SANITIZE_PATTERN, '_').slice(0, MAX_FILENAME_LENGTH);
  }

  private normalizeOwnerType(ownerType: string) {
    return ownerType.trim().toUpperCase();
  }

  private parseDocumentDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('A valid document date is required.');
    }

    return parsed;
  }
}