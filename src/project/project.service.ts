import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectService {
    constructor(private readonly prisma: PrismaService) { }

    async create(adminId: string, createProjectDto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                ...createProjectDto,
                adminId,
            },
        });
    }

    async findAll(adminId: string) {
        return this.prisma.project.findMany({
            where: { adminId },
        });
    }

    async findOne(id: string, adminId: string) {
        return this.prisma.project.findFirst({
            where: { id, adminId },
        });
    }

    async update(id: string, adminId: string, updateData: Partial<CreateProjectDto>) {
        // Verify ownership first or rely on where clause if updateMany is not desired
        // findUnique + check or updateMany
        // Using updateMany to ensure adminId matches without extra query, though update is usually by ID.
        // Better: findFirst to check ownership, then update.

        const project = await this.prisma.project.findFirst({
            where: { id, adminId }
        });

        if (!project) {
            throw new Error('Project not found or access denied');
        }

        return this.prisma.project.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string, adminId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, adminId }
        });

        if (!project) {
            throw new Error('Project not found or access denied');
        }

        return this.prisma.project.delete({
            where: { id },
        });
    }
}
