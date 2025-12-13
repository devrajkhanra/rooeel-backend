import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, AdminModule, UserModule],
})
export class AppModule {}
