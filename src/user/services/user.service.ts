import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUserService } from '../interfaces/user.interface';
import { PasswordService } from '../../common/services/password.service';
import { CustomLogger } from '../../logger/logger.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService implements IUserService {
    private readonly logger: CustomLogger;

    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
    ) {
        this.logger = new CustomLogger();
        this.logger.setContext(UserService.name);
    }

    async create(createUserDto: CreateUserDto, adminId: number): Promise<User> {
        // Check if user already exists
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        this.logger.debug(`Creating user: ${createUserDto.email} by admin ID: ${adminId}`);
        const hashedPassword = await this.passwordService.hash(createUserDto.password);
        const user = await this.prisma.user.create({
            data: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                email: createUserDto.email,
                password: hashedPassword,
                createdBy: adminId,
            },
        });
        this.logger.log(`User created successfully: ${user.email} (ID: ${user.id}) by admin ID: ${adminId}`);
        return user;
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

        this.logger.debug(`Updating user: ${user.email} (ID: ${id})`);
        const data: any = { ...updateUserDto };
        if (updateUserDto.password) {
            data.password = await this.passwordService.hash(updateUserDto.password);
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
        });
        this.logger.log(`User updated successfully: ${updatedUser.email} (ID: ${id})`);
        return updatedUser;
    }

    async remove(id: number): Promise<void> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        this.logger.warn(`Deleting user: ${user.email} (ID: ${id})`);
        await this.prisma.user.delete({ where: { id } });
        this.logger.log(`User deleted successfully: ${user.email} (ID: ${id})`);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
}
