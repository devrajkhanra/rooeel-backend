import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthGuard } from './auth.gaurd';

@Module({
    imports: [
        PrismaModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'fallback-secret-change-this',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AdminController],
    providers: [AdminService, JwtStrategy, AuthGuard],
    exports: [AuthGuard],
})
export class AdminModule { }
