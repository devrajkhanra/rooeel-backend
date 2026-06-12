import { Field, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import {
  ProjectModuleStatus,
  ProjectModuleType,
  ProjectStatus,
} from './project.enums';

@ObjectType()
export class ProjectConfigurationModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, unknown>;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class ProjectModuleModel {
  @Field()
  id: string;

  @Field()
  projectId: string;

  @Field(() => ProjectModuleType)
  type: ProjectModuleType;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ProjectModuleStatus)
  status: ProjectModuleStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
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

  @Field(() => [ProjectModuleModel])
  modules: ProjectModuleModel[];

  @Field(() => Int)
  tenderStageCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
