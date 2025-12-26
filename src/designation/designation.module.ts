import { Module } from '@nestjs/common';
import { DesignationController } from './designation.controller';
import { DesignationService } from './services/designation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DesignationController],
    providers: [DesignationService],
    exports: [DesignationService],
})
export class DesignationModule { }
