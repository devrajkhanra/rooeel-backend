import { Controller, Post, Body, Headers, UnauthorizedException, UseGuards, Get } from '@nestjs/common';
import { UserAuthGuard } from './guards/user-auth.guard';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { CurrentAdmin } from '../admin/decorators/current-admin.decorator';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    @UseGuards(AdminAuthGuard)
    async create(@CurrentAdmin() admin: any, @Body() createUserDto: CreateUserDto) {
        return this.userService.create(admin.id, createUserDto);
    }

    @Get()
    @UseGuards(AdminAuthGuard)
    async findAll(@CurrentAdmin() admin: any) {
        return this.userService.findAllByAdmin(admin.id);
    }

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
