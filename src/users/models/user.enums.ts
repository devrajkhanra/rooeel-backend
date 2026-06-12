import { registerEnumType } from '@nestjs/graphql';
import { UserStatus as PrismaUserStatus } from '@prisma/client';

registerEnumType(PrismaUserStatus, {
  name: 'UserStatus',
});

export { PrismaUserStatus as UserStatus };