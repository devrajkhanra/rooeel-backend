import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from '../admin/services/admin.service';
import { PasswordService as AdminPasswordService } from '../admin/services/password.service';
import { UserService } from '../user/services/user.service';
import { PasswordService as UserPasswordService } from '../user/services/password.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private adminService: AdminService,
        private userService: UserService,
        private jwtService: JwtService,
        private adminPasswordService: AdminPasswordService,
        private userPasswordService: UserPasswordService,
    ) { }

    async signup(signupDto: SignupDto) {
        // Check if admin already exists
        const existingAdmin = await this.adminService.findByEmail(signupDto.email);
        if (existingAdmin) {
            throw new ConflictException('Admin with this email already exists');
        }

        // Create the admin
        const admin = await this.adminService.create(signupDto);

        // Generate JWT token and return
        const payload = { email: admin.email, sub: admin.id, role: 'admin' };
        return {
            access_token: this.jwtService.sign(payload),
            admin: {
                id: admin.id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
            },
        };
    }

    async validateAdmin(email: string, pass: string): Promise<any> {
        const admin = await this.adminService.findByEmail(email);
        if (admin && await this.adminPasswordService.compare(pass, admin.password)) {
            const { password, ...result } = admin;
            return result;
        }
        return null;
    }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.userService.findByEmail(email);
        if (user && await this.userPasswordService.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const admin = await this.validateAdmin(loginDto.email, loginDto.password);
        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: admin.email, sub: admin.id, role: 'admin' };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async loginUser(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: 'user' };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async logout(user: any) {
        // Log the logout event
        this.logger.log(`Admin ${user.email} (ID: ${user.userId}) logged out`);

        // In a stateless JWT system, logout is handled client-side by removing the token
        // This endpoint can be used for logging purposes or future token blacklisting
        return {
            message: 'Logout successful',
        };
    }

    async logoutUser(user: any) {
        // Log the logout event
        this.logger.log(`User ${user.email} (ID: ${user.userId}) logged out`);

        // In a stateless JWT system, logout is handled client-side by removing the token
        // This endpoint can be used for logging purposes or future token blacklisting
        return {
            message: 'Logout successful',
        };
    }
}
