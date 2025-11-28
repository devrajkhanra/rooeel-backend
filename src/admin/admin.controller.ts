import { Controller, Post, Body, Headers, Get, UnauthorizedException, Param, Put, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SignupAdminDto } from './dto/signup-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('signup')
    async signup(@Body() body: SignupAdminDto) {
        if (!body.name) {
            throw new UnauthorizedException('Name is required');
        }
        return this.adminService.signup(body as { name: string; email: string; password: string });
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

    @Get('profile')
    async profile(@Headers('authorization') auth?: string) {
        const token = this.extractToken(auth);
        if (!token) {
            throw new UnauthorizedException('Authorization token is required');
        }
        return this.adminService.validateToken(token);
    }

    // create user (admin-only)
    @Post('users')
    async createUser(@Body() body: CreateAdminDto) {
        return this.adminService.createUser(body as any);
    }

    // set password for a user (admin-only)
    @Put('users/:id/password')
    async setPassword(@Param('id') id: string, @Body() body: UpdatePasswordDto) {
        return this.adminService.setPassword(id, body.password);
    }

    // reset password by email (admin-only) - returns generated password
    @Post('users/reset-password')
    async resetPassword(@Body() body: ResetPasswordDto) {
        return this.adminService.resetPasswordByEmail(body.email);
    }

    // delete user
    @Delete('users/:id')
    async deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    // assign role
    @Post('users/:id/role')
    async assignRole(@Param('id') id: string, @Body() body: AssignRoleDto) {
        return this.adminService.assignRole(id, body.role);
    }

    private extractToken(authorization?: string) {
        if (!authorization) return undefined;
        const parts = authorization.split(' ');
        if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'bearer')) {
            return parts[1];
        }
        return authorization; // allow raw token as fallback
    }
}