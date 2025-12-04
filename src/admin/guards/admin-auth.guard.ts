import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('Authorization token is required');
        }

        const session = await this.prisma.adminSession.findUnique({
            where: { id: token },
            include: { admin: true },
        });

        if (!session) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        if (session.expiresAt && session.expiresAt < new Date()) {
            throw new UnauthorizedException('Token expired');
        }

        request.admin = session.admin;
        request.token = token;
        return true;
    }

    private extractToken(request: any): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) return undefined;

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
