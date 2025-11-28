import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    private hashPassword(password: string, salt: string) {
        return crypto.scryptSync(password, salt, 64).toString('hex');
    }

    private sanitize(admin: { id: string; name: string; email: string; role: string | null; createdAt: Date; updatedAt: Date }) {
        return {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
        };
    }

    async signup(payload: { name: string; email: string; password: string }) {
        const exists = await this.prisma.admin.findUnique({
            where: { email: payload.email.toLowerCase() }
        });
        if (exists) throw new ConflictException('Email already in use');

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(payload.password, salt);

        const admin = await this.prisma.admin.create({
            data: {
                name: payload.name,
                email: payload.email.toLowerCase(),
                salt,
                passwordHash,
                role: 'admin',
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
        await this.prisma.session.create({
            data: {
                id: token,
                adminId: admin.id,
            }
        });

        return { token, user: this.sanitize(admin) };
    }

    async logout(token: string) {
        if (!token) throw new UnauthorizedException();
        const session = await this.prisma.session.delete({
            where: { id: token }
        }).catch(() => null);

        if (!session) throw new NotFoundException('Session not found');
        return { success: true };
    }

    async validateToken(token: string) {
        if (!token) throw new UnauthorizedException();
        const session = await this.prisma.session.findUnique({
            where: { id: token },
            include: { admin: true }
        });

        if (!session) throw new UnauthorizedException();
        return this.sanitize(session.admin);
    }

    async findAllUsers() {
        const admins = await this.prisma.admin.findMany();
        return admins.map(a => this.sanitize(a));
    }

    async findUserById(id: string) {
        const user = await this.prisma.admin.findUnique({
            where: { id }
        });
        if (!user) throw new NotFoundException('User not found');
        return this.sanitize(user);
    }

    async createUser(payload: { name: string; email: string; password?: string; role?: string }) {
        const exists = await this.prisma.admin.findUnique({
            where: { email: payload.email.toLowerCase() }
        });
        if (exists) throw new ConflictException('Email already in use');

        const salt = crypto.randomBytes(16).toString('hex');
        const password = payload.password ?? Math.random().toString(36).slice(-10);
        const passwordHash = this.hashPassword(password, salt);

        const admin = await this.prisma.admin.create({
            data: {
                name: payload.name,
                email: payload.email.toLowerCase(),
                salt,
                passwordHash,
                role: payload.role ?? 'admin',
            }
        });

        const result: any = this.sanitize(admin);
        if (!payload.password) result.generatedPassword = password;
        return result;
    }

    async setPassword(adminId: string, newPassword: string) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId }
        });
        if (!admin) throw new NotFoundException('User not found');

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(newPassword, salt);

        const updated = await this.prisma.admin.update({
            where: { id: adminId },
            data: { salt, passwordHash }
        });

        // Invalidate all sessions for this admin
        await this.prisma.session.deleteMany({
            where: { adminId }
        });

        return this.sanitize(updated);
    }

    async resetPasswordByEmail(email: string) {
        const admin = await this.prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (!admin) throw new NotFoundException('User not found');

        const newPassword = Math.random().toString(36).slice(-10);
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(newPassword, salt);

        const updated = await this.prisma.admin.update({
            where: { id: admin.id },
            data: { salt, passwordHash }
        });

        // Invalidate all sessions for this admin
        await this.prisma.session.deleteMany({
            where: { adminId: admin.id }
        });

        return { ...this.sanitize(updated), newPassword };
    }

    async deleteUser(id: string) {
        const admin = await this.prisma.admin.findUnique({
            where: { id }
        });
        if (!admin) throw new NotFoundException('User not found');

        // Sessions will be deleted automatically due to CASCADE
        await this.prisma.admin.delete({
            where: { id }
        });

        return this.sanitize(admin);
    }

    async assignRole(id: string, role: string) {
        const admin = await this.prisma.admin.update({
            where: { id },
            data: { role }
        }).catch(() => null);

        if (!admin) throw new NotFoundException('User not found');
        return this.sanitize(admin);
    }
}