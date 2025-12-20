import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUserService } from '../interfaces/user.interface';
import { PasswordService } from './password.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService implements IUserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const hashedPassword = await this.passwordService.hash(createUserDto.password);
        return this.prisma.user.create({
            data: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                email: createUserDto.email,
                password: hashedPassword,
            },
        });
    }

    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        const data: any = { ...updateUserDto };
        if (updateUserDto.password) {
            data.password = await this.passwordService.hash(updateUserDto.password);
        }

        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async remove(id: number): Promise<void> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        await this.prisma.user.delete({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
}
