import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { IAdminService } from '../interfaces/admin.interface';
import { PasswordService } from './password.service';
import { Admin } from '@prisma/client';

@Injectable()
export class AdminService implements IAdminService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
    ) { }

    async create(createAdminDto: CreateAdminDto): Promise<Admin> {
        const hashedPassword = await this.passwordService.hash(createAdminDto.password);
        return this.prisma.admin.create({
            data: {
                firstName: createAdminDto.firstName,
                lastName: createAdminDto.lastName,
                email: createAdminDto.email,
                password: hashedPassword,
            },
        });
    }

    async findAll(): Promise<Admin[]> {
        return this.prisma.admin.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number): Promise<Admin | null> {
        const admin = await this.prisma.admin.findUnique({
            where: { id },
        });
        return admin;
    }

    async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
        const admin = await this.findOne(id);
        if (!admin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }

        const data: any = { ...updateAdminDto };
        if (updateAdminDto.password) {
            data.password = await this.passwordService.hash(updateAdminDto.password);
        }

        return this.prisma.admin.update({
            where: { id },
            data,
        });
    }

    async remove(id: number): Promise<void> {
        const admin = await this.findOne(id);
        if (!admin) {
            throw new NotFoundException(`Admin with ID ${id} not found`);
        }
        await this.prisma.admin.delete({ where: { id } });
    }

    async findByEmail(email: string): Promise<Admin | null> {
        return this.prisma.admin.findUnique({
            where: { email },
        });
    }
}

