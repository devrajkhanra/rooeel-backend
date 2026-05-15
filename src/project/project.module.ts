import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProjectController } from './project.controller';
import { ProjectService } from './services/project.service';
import { PrismaModule } from '../prisma/prisma.module';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        PrismaModule,
        MulterModule.register({
            storage: memoryStorage(),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            },
        }),
    ],
    controllers: [ProjectController],
    providers: [ProjectService],
    exports: [ProjectService],
})
export class ProjectModule { }
