import { Field, ObjectType } from '@nestjs/graphql';
import { DocumentModel } from '../../documents/models/document.models';
import {
  TenderStageEventType,
  ProjectStatus,
  TenderStageStatus,
  TenderStageType,
} from './project.enums';

@ObjectType()
export class ProjectConfigurationModel {
  @Field()
  id: string;

  @Field()
  projectId: string;
}

@ObjectType()
export class ProjectModel {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ProjectStatus)
  status: ProjectStatus;

  @Field(() => ProjectConfigurationModel, { nullable: true })
  configuration?: ProjectConfigurationModel;

  @Field(() => [ProjectTenderStageModel])
  tenderStages: ProjectTenderStageModel[];
}

@ObjectType()
export class ProjectTenderStageModel {
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

  @Field(() => [ProjectTenderStageEventModel])
  events: ProjectTenderStageEventModel[];
}

@ObjectType()
export class ProjectTenderStageEventModel {
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
