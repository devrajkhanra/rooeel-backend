import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { DocumentsModule } from '../documents/documents.module';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthorizationModule, DocumentsModule],
  providers: [ProjectsService, ProjectsResolver],
  exports: [ProjectsService],
})
export class ProjectsModule {}
