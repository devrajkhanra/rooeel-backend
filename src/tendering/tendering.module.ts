import { Module } from '@nestjs/common';
import { PrismaModule } from '../core/prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { TenderingResolver } from './tendering.resolver';
import { TenderingService } from './tendering.service';

@Module({
  imports: [PrismaModule, DocumentsModule, AuthorizationModule],
  providers: [TenderingResolver, TenderingService],
  exports: [TenderingService],
})
export class TenderingModule {}