import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DocumentsResolver } from './documents.resolver';
import { DocumentsService } from './documents.service';

@Module({
  imports: [AuthorizationModule],
  providers: [DocumentsService, DocumentsResolver],
  exports: [DocumentsService],
})
export class DocumentsModule {}
