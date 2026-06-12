import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { ProjectModuleType } from '../models/project.enums';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}

@InputType()
export class UpdateProjectInput {
  @Field()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}

@InputType()
export class UpdateProjectConfigurationInput {
  @Field({ nullable: true })
  @IsOptional()
  notes?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: Record<string, unknown> | null;
}

@InputType()
export class CreateProjectModuleInput {
  @Field(() => ProjectModuleType)
  @IsEnum(ProjectModuleType)
  type: ProjectModuleType;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}

@InputType()
export class UpdateProjectModuleInput {
  @Field()
  @IsNotEmpty()
  moduleId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;
}
