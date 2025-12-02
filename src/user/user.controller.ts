import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post('login')
    async login(@Body() body: LoginUserDto) {
        return this.userService.login(body);
    }

    @Post('logout')
    async logout(@Headers('authorization') auth?: string) {
        const token = this.extractToken(auth);
        if (!token) {
            throw new UnauthorizedException('Authorization token is required');
        }
        return this.userService.logout(token);
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
