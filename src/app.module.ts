import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AdminModule, UserModule, ProjectModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
