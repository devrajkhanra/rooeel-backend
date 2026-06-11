import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DocumentAttachmentModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field()
  documentId: string;

  @Field()
  objectKey: string;

  @Field()
  fileName: string;

  @Field()
  contentType: string;

  @Field(() => Int, { nullable: true })
  sizeBytes?: number;

  @Field({ nullable: true })
  uploadedById?: string;

  @Field()
  uploadedAt: Date;
}

@ObjectType()
export class DocumentModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field()
  ownerType: string;

  @Field()
  ownerId: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  documentDate?: Date;

  @Field()
  status: string;

  @Field(() => [DocumentAttachmentModel])
  attachments: DocumentAttachmentModel[];
}

@ObjectType()
export class PresignedUploadModel {
  @Field()
  objectKey: string;

  @Field()
  uploadUrl: string;

  @Field()
  expiresInSeconds: number;
}

@ObjectType()
export class PresignedDownloadModel {
  @Field()
  downloadUrl: string;

  @Field()
  expiresInSeconds: number;
}
