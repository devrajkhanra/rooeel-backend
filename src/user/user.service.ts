import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    private hashPassword(password: string, salt: string) {
        return crypto.scryptSync(password, salt, 64).toString('hex');
    }

    private sanitize(user: { id: string; firstName: string; lastName: string; email: string; isActive?: boolean; createdAt: Date; updatedAt: Date }) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isActive: user.isActive ?? true,
        };
    }

    async updateStatus(userId: string, adminId: string, isActive: boolean) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, createdByAdminId: adminId }
        });

        if (!user) {
            throw new NotFoundException('User not found or access denied');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { isActive }
        });

        return this.sanitize(updatedUser);
    }

    async create(adminId: string, createUserDto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: createUserDto.email.toLowerCase() }
        });

        if (existing) {
            throw new BadRequestException('User with this email already exists');
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(createUserDto.password, salt);

        const user = await this.prisma.user.create({
            data: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                email: createUserDto.email.toLowerCase(),
                passwordHash,
                salt,
                createdByAdminId: adminId,
            }
        });

        return this.sanitize(user);
    }

    async findAllByAdmin(adminId: string) {
        const users = await this.prisma.user.findMany({
            where: { createdByAdminId: adminId }
        });
        return users.map(user => this.sanitize(user));
    }

    async login(payload: { email: string; password: string }) {
        const user = await this.prisma.user.findUnique({
            where: { email: payload.email.toLowerCase() }
        });
        if (!user) throw new NotFoundException('Invalid credentials');

        const attempted = this.hashPassword(payload.password, user.salt);
        if (!crypto.timingSafeEqual(Buffer.from(attempted, 'hex'), Buffer.from(user.passwordHash, 'hex'))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = crypto.randomBytes(32).toString('hex');
        await this.prisma.userSession.create({
            data: {
                id: token,
                userId: user.id,
            }
        });

        return { token, user: this.sanitize(user) };
    }

    async logout(token: string) {
        if (!token) throw new UnauthorizedException();
        const session = await this.prisma.userSession.delete({
            where: { id: token }
        }).catch(() => null);

        if (!session) throw new NotFoundException('Session not found');
        return { success: true };
    }
}
