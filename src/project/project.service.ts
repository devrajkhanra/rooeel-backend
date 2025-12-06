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

    async assignUser(id: string, userId: string, adminId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, adminId }
        });

        if (!project) {
            throw new Error('Project not found or access denied');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.isActive === false) {
            throw new Error('User is inactive or not found');
        }

        try {
            return await this.prisma.projectAssignment.create({
                data: {
                    projectId: id,
                    userId: userId,
                }
            });
        } catch (error) {
            const existing = await this.prisma.projectAssignment.findUnique({
                where: { projectId_userId: { projectId: id, userId } }
            });
            if (existing) return existing;
            throw error;
        }
    }

    async unassignUser(id: string, userId: string, adminId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, adminId }
        });

        if (!project) {
            throw new Error('Project not found or access denied');
        }

        return this.prisma.projectAssignment.delete({
            where: {
                projectId_userId: {
                    projectId: id,
                    userId: userId
                }
            }
        });
    }

    async getAssignedUsers(id: string, adminId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, adminId },
        });

        if (!project) {
            throw new Error('Project not found or access denied');
        }

        const assignments = await this.prisma.projectAssignment.findMany({
            where: { projectId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });

        return assignments.map(a => ({
            ...a.user,
            role: a.role,
            assignedAt: a.assignedAt
        }));
    }

    async assignRole(id: string, userId: string, role: string, adminId: string) {
        const project = await this.prisma.project.findFirst({
            where: { id, adminId }
        });

        if (!project) {
            throw new Error('Project not found or access denied');
        }

        return this.prisma.projectAssignment.update({
            where: {
                projectId_userId: {
                    projectId: id,
                    userId: userId
                }
            },
            data: { role }
        });
    }
}
