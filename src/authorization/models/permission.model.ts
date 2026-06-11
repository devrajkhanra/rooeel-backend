import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PermissionModel {
  @Field()
  id: string;

  @Field()
  token: string;

  @Field({ nullable: true })
  description?: string;
}
