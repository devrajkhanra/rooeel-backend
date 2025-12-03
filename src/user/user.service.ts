import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    private hashPassword(password: string, salt: string) {
        return crypto.scryptSync(password, salt, 64).toString('hex');
    }

    private sanitize(user: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
        };
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
