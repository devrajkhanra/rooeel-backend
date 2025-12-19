import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './services/admin.service';
import { PasswordService } from './services/password.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PasswordService, PrismaService],
  exports: [AdminService],
})
export class AdminModule { }
