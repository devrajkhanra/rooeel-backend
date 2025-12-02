import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SignupAdminDto } from './dto/signup-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('signup')
    async signup(@Body() body: SignupAdminDto) {
        return this.adminService.signup(body);
    }

    @Post('login')
    async login(@Body() body: LoginAdminDto) {
        return this.adminService.login(body);
    }

    @Post('logout')
    async logout(@Headers('authorization') auth?: string) {
        const token = this.extractToken(auth);
        if (!token) {
            throw new UnauthorizedException('Authorization token is required');
        }
        return this.adminService.logout(token);
    }

    private extractToken(authorization?: string) {
        if (!authorization) return undefined;
        const parts = authorization.split(' ');
        if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'bearer')) {
            return parts[1];
        }
        return authorization;
    }
}
