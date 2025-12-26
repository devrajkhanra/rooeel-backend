import { Admin, User } from '@prisma/client';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';

export interface IAuthService {
    signup(signupDto: SignupDto): Promise<{
        access_token: string;
        admin: { id: number; firstName: string; lastName: string; email: string }
    }>;
    login(loginDto: LoginDto): Promise<{ access_token: string }>;
    loginUser(loginDto: LoginDto): Promise<{ access_token: string }>;
    validateAdmin(email: string, password: string): Promise<Omit<Admin, 'password'> | null>;
    validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null>;
    logout(user: any): Promise<{ message: string }>;
    logoutUser(user: any): Promise<{ message: string }>;
}
