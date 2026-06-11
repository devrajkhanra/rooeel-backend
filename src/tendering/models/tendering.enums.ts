import { registerEnumType } from '@nestjs/graphql';
import {
  TenderStageEventType as PrismaTenderStageEventType,
  TenderStageStatus as PrismaTenderStageStatus,
  TenderStageType as PrismaTenderStageType,
} from '@prisma/client';

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
  PrismaTenderStageEventType as TenderStageEventType,
  PrismaTenderStageStatus as TenderStageStatus,
  PrismaTenderStageType as TenderStageType,
};
