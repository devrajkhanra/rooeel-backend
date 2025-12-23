import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './services/project.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProjectController],
    providers: [ProjectService],
    exports: [ProjectService],
})
export class ProjectModule { }
