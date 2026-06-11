import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthUser {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  expiresInSeconds: number;

  @Field(() => AuthUser)
  user: AuthUser;
}
