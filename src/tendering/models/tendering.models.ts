import { Field, ObjectType } from '@nestjs/graphql';
import { DocumentModel } from '../../documents/models/document.models';
import {
  TenderStageEventType,
  TenderStageStatus,
  TenderStageType,
} from './tendering.enums';

@ObjectType()
export class TenderStageModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field(() => TenderStageType)
  stage: TenderStageType;

  @Field()
  sequence: number;

  @Field(() => TenderStageStatus)
  status: TenderStageStatus;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  skippedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [DocumentModel])
  documents: DocumentModel[];

  @Field(() => [TenderStageEventModel])
  events: TenderStageEventModel[];
}

@ObjectType()
export class TenderStageEventModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field()
  stageId: string;

  @Field(() => TenderStageEventType)
  eventType: TenderStageEventType;

  @Field()
  eventDate: Date;

  @Field({ nullable: true })
  note?: string;

  @Field()
  sequence: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [DocumentModel])
  documents: DocumentModel[];
}
