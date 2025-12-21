import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signup')
    async signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@Request() req) {
        return this.authService.logout(req.user);
    }

    @Post('user/signup')
    async userSignup(@Body() signupDto: SignupDto) {
        return this.authService.signupUser(signupDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('user/login')
    async userLogin(@Body() loginDto: LoginDto) {
        return this.authService.loginUser(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('user/logout')
    async userLogout(@Request() req) {
        return this.authService.logoutUser(req.user);
    }
}
