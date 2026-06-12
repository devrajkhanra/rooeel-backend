import { Field, InputType } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';
import { TenderStageEventType } from '../models/tendering.enums';

@InputType()
export class UpdateTenderStageInput {
  @Field()
  @IsNotEmpty()
  stageId: string;

  @Field({ nullable: true })
  @IsOptional()
  note?: string;
}

@InputType()
export class CreateTenderStageDocumentInput {
  @Field()
  @IsNotEmpty()
  stageId: string;

  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  documentDate?: string;
}

@InputType()
export class CreateTenderStageEventInput {
  @Field()
  @IsNotEmpty()
  stageId: string;

  @Field(() => TenderStageEventType)
  eventType: TenderStageEventType;

  @Field()
  @IsDateString()
  eventDate: string;

  @Field({ nullable: true })
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  note?: string;
}

@InputType()
export class UpdateTenderStageEventInput {
  @Field()
  @IsNotEmpty()
  eventId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  note?: string;
}

@InputType()
export class DeleteTenderStageEventInput {
  @Field()
  @IsNotEmpty()
  eventId: string;
}

@InputType()
export class CreateTenderStageEventDocumentInput {
  @Field()
  @IsNotEmpty()
  eventId: string;

  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  documentDate?: string;
}