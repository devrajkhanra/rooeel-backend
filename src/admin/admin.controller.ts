import { Controller, Post, Body, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from './guards/admin-auth.guard';
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
    @UseGuards(AdminAuthGuard)
    async logout(@Headers('authorization') auth: string) {
        // We can extract token from header or request. 
        // Since the service expects a token, and the guard validates it, 
        // we can just pass the token.
        // However, the guard puts the token on the request object if we want.
        // Let's stick to extracting it or using the one validated.
        // The previous implementation extracted it manually.
        // Let's use the one from the header for now to match signature, 
        // or better, extract it from the request if we modified the guard to attach it.
        // My guard attaches `request.token`.
        // But I can't easily access request in the controller method without @Req().
        // Let's just re-extract or assume the header is valid (it is, because of the guard).
        const token = auth.split(' ')[1];
        return this.adminService.logout(token);
    }
}
