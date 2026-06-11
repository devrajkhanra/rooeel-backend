import { registerEnumType } from '@nestjs/graphql';
import { ProjectStatus as PrismaProjectStatus } from '@prisma/client';

registerEnumType(PrismaProjectStatus, {
  name: 'ProjectStatus',
});

export { PrismaProjectStatus as ProjectStatus };
