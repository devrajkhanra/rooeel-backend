import { Controller, Post, Body, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UserAuthGuard } from './guards/user-auth.guard';
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
    @UseGuards(UserAuthGuard)
    async logout(@Headers('authorization') auth: string) {
        const token = auth.split(' ')[1];
        return this.userService.logout(token);
    }
}
