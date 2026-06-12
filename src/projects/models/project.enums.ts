import { registerEnumType } from '@nestjs/graphql';
import {
  ProjectModuleStatus as PrismaProjectModuleStatus,
  ProjectModuleType as PrismaProjectModuleType,
  ProjectStatus as PrismaProjectStatus,
} from '@prisma/client';

registerEnumType(PrismaProjectStatus, {
  name: 'ProjectStatus',
});

registerEnumType(PrismaProjectModuleType, {
  name: 'ProjectModuleType',
});

registerEnumType(PrismaProjectModuleStatus, {
  name: 'ProjectModuleStatus',
});

export {
  PrismaProjectModuleStatus as ProjectModuleStatus,
  PrismaProjectModuleType as ProjectModuleType,
  PrismaProjectStatus as ProjectStatus,
};
