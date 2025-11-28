import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

type Admin = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    salt: string;
    role?: string;
};

@Injectable()
export class AdminService {
    // start with no admins
    private admins: Admin[] = [];
    private tokens = new Map<string, string>(); // token -> adminId

    constructor() { }

    private hashPassword(password: string, salt: string) {
        return crypto.scryptSync(password, salt, 64).toString('hex');
    }

    private sanitize(admin: Admin) {
        const { passwordHash, salt, ...rest } = admin;
        return rest;
    }

    async signup(payload: { name: string; email: string; password: string }) {
        const exists = this.admins.find(a => a.email === payload.email.toLowerCase());
        if (exists) throw new ConflictException('Email already in use');

        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = this.hashPassword(payload.password, salt);
        const id = crypto.randomBytes(8).toString('hex');

        const admin: Admin = {
            id,
            name: payload.name,
            email: payload.email.toLowerCase(),
            salt,
            passwordHash,
            role: 'admin',
        };

        this.admins.push(admin);
        return this.sanitize(admin);
    }

    async login(payload: { email: string; password: string }) {
        const admin = this.admins.find(a => a.email === payload.email.toLowerCase());
        if (!admin) throw new NotFoundException('Invalid credentials');

        const attempted = this.hashPassword(payload.password, admin.salt);
        if (!crypto.timingSafeEqual(Buffer.from(attempted, 'hex'), Buffer.from(admin.passwordHash, 'hex'))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = crypto.randomBytes(32).toString('hex');
        this.tokens.set(token, admin.id);
        return { token, user: this.sanitize(admin) };
    }

    async logout(token: string) {
        if (!token) throw new UnauthorizedException();
        const existed = this.tokens.delete(token);
        if (!existed) throw new NotFoundException('Session not found');
        return { success: true };
    }

    async validateToken(token: string) {
        if (!token) throw new UnauthorizedException();
        const adminId = this.tokens.get(token);
        if (!adminId) throw new UnauthorizedException();
        const admin = this.admins.find(a => a.id === adminId);
        if (!admin) {
            this.tokens.delete(token);
            throw new NotFoundException('Admin not found');
        }
        return this.sanitize(admin);
    }

    findAllUsers() {
        return this.admins.map(a => this.sanitize(a));
    }

    findUserById(id: string) {
        const user = this.admins.find(u => u.id === id);
        if (!user) throw new NotFoundException('User not found');
        return this.sanitize(user);
    }

    createUser(payload: { name: string; email: string; password?: string; role?: string }) {
        const exists = this.admins.find(a => a.email === payload.email.toLowerCase());
        if (exists) throw new ConflictException('Email already in use');

        const id = crypto.randomBytes(8).toString('hex');
        const salt = crypto.randomBytes(16).toString('hex');
        const password = payload.password ?? Math.random().toString(36).slice(-10);
        const passwordHash = this.hashPassword(password, salt);

        const admin: Admin = {
            id,
            name: payload.name,
            email: payload.email.toLowerCase(),
            salt,
            passwordHash,
            role: payload.role ?? 'admin',
        };

        this.admins.push(admin);
        // return sanitized user and (for convenience) generated password when one was generated
        const result: any = this.sanitize(admin);
        if (!payload.password) result.generatedPassword = password;
        return result;
    }

    setPassword(adminId: string, newPassword: string) {
        const admin = this.admins.find(a => a.id === adminId);
        if (!admin) throw new NotFoundException('User not found');

        const salt = crypto.randomBytes(16).toString('hex');
        admin.salt = salt;
        admin.passwordHash = this.hashPassword(newPassword, salt);
        // invalidate tokens for this admin
        for (const [token, id] of Array.from(this.tokens.entries())) {
            if (id === adminId) this.tokens.delete(token);
        }
        return this.sanitize(admin);
    }

    resetPasswordByEmail(email: string) {
        const admin = this.admins.find(a => a.email === email.toLowerCase());
        if (!admin) throw new NotFoundException('User not found');

        const newPassword = Math.random().toString(36).slice(-10);
        const salt = crypto.randomBytes(16).toString('hex');
        admin.salt = salt;
        admin.passwordHash = this.hashPassword(newPassword, salt);

        // invalidate tokens for this admin
        for (const [token, id] of Array.from(this.tokens.entries())) {
            if (id === admin.id) this.tokens.delete(token);
        }

        // return newPassword so caller (or email sending) can communicate it to the user
        return { ...this.sanitize(admin), newPassword };
    }

    deleteUser(id: string) {
        const idx = this.admins.findIndex(a => a.id === id);
        if (idx === -1) throw new NotFoundException('User not found');

        const [removed] = this.admins.splice(idx, 1);
        // remove any tokens belonging to deleted user
        for (const [token, uid] of Array.from(this.tokens.entries())) {
            if (uid === id) this.tokens.delete(token);
        }
        return this.sanitize(removed);
    }

    assignRole(id: string, role: string) {
        const admin = this.admins.find(a => a.id === id);
        if (!admin) throw new NotFoundException('User not found');
        admin.role = role;
        return this.sanitize(admin);
    }
}