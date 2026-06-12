import { Field, ObjectType } from '@nestjs/graphql';
import { UserStatus } from './user.enums';

@ObjectType()
export class AdminUserModel {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => UserStatus)
  status: UserStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}