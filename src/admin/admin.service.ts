import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    private hashPassword(password: string, salt: string) {
        return crypto.scryptSync(password, salt, 64).toString('hex');
    }

    private sanitize(admin: { id: string; firstName: string; lastName: string; email: string; createdAt: Date; updatedAt: Date }) {
        return {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
        };
    }

    async signup(payload: { firstName: string; lastName: string; email: string; password: string }) {
        const exists = await this.prisma.admin.findUnique({
            where: { email: payload.email.toLowerCase() }
        });
        if (exists) throw new ConflictException('Email already in use');

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(payload.password, salt);

        const admin = await this.prisma.admin.create({
            data: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email.toLowerCase(),
                salt,
                passwordHash,
            }
        });

        return this.sanitize(admin);
    }

    async login(payload: { email: string; password: string }) {
        const admin = await this.prisma.admin.findUnique({
            where: { email: payload.email.toLowerCase() }
        });
        if (!admin) throw new NotFoundException('Invalid credentials');

        const attempted = this.hashPassword(payload.password, admin.salt);
        if (!crypto.timingSafeEqual(Buffer.from(attempted, 'hex'), Buffer.from(admin.passwordHash, 'hex'))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = crypto.randomBytes(32).toString('hex');
        await this.prisma.adminSession.create({
            data: {
                id: token,
                adminId: admin.id,
            }
        });

        return { token, user: this.sanitize(admin) };
    }

    async logout(token: string) {
        if (!token) throw new UnauthorizedException();
        const session = await this.prisma.adminSession.delete({
            where: { id: token }
        }).catch(() => null);

        if (!session) throw new NotFoundException('Session not found');
        return { success: true };
    }
}
