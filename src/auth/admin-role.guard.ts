import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminRoleGuard extends JwtAuthGuard {
    canActivate(context: ExecutionContext) {
        // First, ensure the user is authenticated via JWT
        const isAuthenticated = super.canActivate(context);

        if (!isAuthenticated) {
            return false;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if the user has admin role
        if (!user || user.role !== 'admin') {
            throw new ForbiddenException('Only admins can perform this action');
        }

        return true;
    }
}
