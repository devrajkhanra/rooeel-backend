import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

@InputType()
export class CreateDocumentInput {
  @Field()
  @IsNotEmpty()
  ownerType: string;

  @Field()
  @IsNotEmpty()
  ownerId: string;

  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateString()
  documentDate?: string;
}

@InputType()
export class UpdateDocumentInput {
  @Field()
  @IsNotEmpty()
  documentId: string;

  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDateString()
  documentDate?: string;
}

@InputType()
export class RequestAttachmentUploadInput {
  @Field()
  @IsNotEmpty()
  documentId: string;

  @Field()
  @IsNotEmpty()
  fileName: string;

  @Field()
  @IsNotEmpty()
  contentType: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeBytes?: number;
}

@InputType()
export class ConfirmAttachmentUploadInput {
  @Field()
  @IsNotEmpty()
  documentId: string;

  @Field()
  @IsNotEmpty()
  objectKey: string;

  @Field()
  @IsNotEmpty()
  fileName: string;

  @Field()
  @IsNotEmpty()
  contentType: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeBytes?: number;
}
