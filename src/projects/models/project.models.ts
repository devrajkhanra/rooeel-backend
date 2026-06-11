import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjectStatus } from './project.enums';

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

  @Field(() => Int)
  tenderStageCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
