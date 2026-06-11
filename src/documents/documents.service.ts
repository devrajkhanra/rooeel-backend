import { BadRequestException, Injectable } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../core/prisma/prisma.service';
import { StorageService } from '../core/storage/storage.service';
import {
  ConfirmAttachmentUploadInput,
  CreateDocumentInput,
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

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createDocument(projectId: string, input: CreateDocumentInput) {
    const ownerType = this.normalizeOwnerType(input.ownerType);
    await this.ensureOwnerBelongsToProject(projectId, ownerType, input.ownerId);
    const documentDate = input.documentDate
      ? this.parseDocumentDate(input.documentDate)
      : null;

    return this.prisma.document.create({
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
  }

  async listDocuments(projectId: string, ownerType?: string, ownerId?: string) {
    return this.prisma.document.findMany({
      where: {
        projectId,
        ownerType: ownerType ? this.normalizeOwnerType(ownerType) : undefined,
        ownerId,
        status: 'ACTIVE',
      },
      include: documentInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async updateDocument(projectId: string, input: UpdateDocumentInput) {
    await this.ensureDocumentBelongsToProject(projectId, input.documentId);
    const documentDate = input.documentDate
      ? this.parseDocumentDate(input.documentDate)
      : null;

    return this.prisma.document.update({
      where: { id: input.documentId },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        documentDate,
      },
      include: documentInclude,
    });
  }

  async deleteDocument(projectId: string, documentId: string) {
    const document = await this.ensureDocumentBelongsToProject(projectId, documentId);

    for (const attachment of document.attachments) {
      await this.storage.removeObject(attachment.objectKey);
    }

    await this.prisma.document.delete({
      where: { id: document.id },
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

    return this.prisma.documentAttachment.create({
      data: {
        projectId,
        documentId: input.documentId,
        objectKey: input.objectKey,
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        uploadedById,
      },
    });
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
