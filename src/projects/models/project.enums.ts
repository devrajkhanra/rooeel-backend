import { registerEnumType } from '@nestjs/graphql';
import {
  ProjectStatus as PrismaProjectStatus,
  TenderStageEventType as PrismaTenderStageEventType,
  TenderStageStatus as PrismaTenderStageStatus,
  TenderStageType as PrismaTenderStageType,
} from '@prisma/client';

registerEnumType(PrismaProjectStatus, {
  name: 'ProjectStatus',
});

registerEnumType(PrismaTenderStageType, {
  name: 'TenderStageType',
});

registerEnumType(PrismaTenderStageStatus, {
  name: 'TenderStageStatus',
});

registerEnumType(PrismaTenderStageEventType, {
  name: 'TenderStageEventType',
});

export {
  PrismaProjectStatus as ProjectStatus,
  PrismaTenderStageEventType as TenderStageEventType,
  PrismaTenderStageStatus as TenderStageStatus,
  PrismaTenderStageType as TenderStageType,
};
