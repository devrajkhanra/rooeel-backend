import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { UserService } from './services/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @UseGuards(AdminGuard)
    @Post()
    create(@Request() req, @Body() createUserDto: CreateUserDto) {
        const adminId = req.user.userId;
        return this.userService.create(createUserDto, adminId);
    }

    @Get()
    findAll() {
        return this.userService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.userService.remove(id);
    }
    @UseGuards(AdminGuard)
    @Patch(':id/reset-password')
    resetPassword(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() resetPasswordDto: ResetPasswordDto,
    ) {
        const adminId = req.user.userId;
        return this.userService.resetPassword(id, adminId, resetPasswordDto.password);
    }
}
