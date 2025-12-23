import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { IProjectService, ProjectWithRelations } from '../interfaces/project.interface';
import { CustomLogger } from '../../logger/logger.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectService implements IProjectService {
    private readonly logger: CustomLogger;

    constructor(private readonly prisma: PrismaService) {
        this.logger = new CustomLogger();
        this.logger.setContext(ProjectService.name);
    }

    async create(adminId: number, createProjectDto: CreateProjectDto): Promise<Project> {
        this.logger.debug(`Creating project: ${createProjectDto.name} by admin ID: ${adminId}`);

        const project = await this.prisma.project.create({
            data: {
                name: createProjectDto.name,
                description: createProjectDto.description,
                status: createProjectDto.status || 'active',
                createdBy: adminId,
            },
        });

        this.logger.log(`Project created successfully: ${project.name} (ID: ${project.id}) by admin ID: ${adminId}`);
        return project;
    }

    async findAll(userId: number, role: string): Promise<ProjectWithRelations[]> {
        if (role === 'admin') {
            // Admins see all their projects
            return this.prisma.project.findMany({
                where: { createdBy: userId },
                include: {
                    admin: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    users: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            // Users see only projects they're assigned to
            return this.prisma.project.findMany({
                where: {
                    users: {
                        some: {
                            userId: userId,
                        },
                    },
                },
                include: {
                    admin: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    users: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
    }

    async findOne(id: number): Promise<ProjectWithRelations | null> {
        return this.prisma.project.findUnique({
            where: { id },
            include: {
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async update(id: number, adminId: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
        const project = await this.findOne(id);

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        // Verify the admin owns this project
        if (project.createdBy !== adminId) {
            throw new ForbiddenException('You can only update your own projects');
        }

        this.logger.debug(`Updating project: ${project.name} (ID: ${id})`);

        const updatedProject = await this.prisma.project.update({
            where: { id },
            data: updateProjectDto,
        });

        this.logger.log(`Project updated successfully: ${updatedProject.name} (ID: ${id})`);
        return updatedProject;
    }

    async remove(id: number, adminId: number): Promise<void> {
        const project = await this.findOne(id);

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        // Verify the admin owns this project
        if (project.createdBy !== adminId) {
            throw new ForbiddenException('You can only delete your own projects');
        }

        this.logger.warn(`Deleting project: ${project.name} (ID: ${id})`);
        await this.prisma.project.delete({ where: { id } });
        this.logger.log(`Project deleted successfully: ${project.name} (ID: ${id})`);
    }

    async assignUser(projectId: number, userId: number, adminId: number): Promise<void> {
        const project = await this.findOne(projectId);

        if (!project) {
            throw new NotFoundException(`Project with ID ${projectId} not found`);
        }

        // Verify the admin owns this project
        if (project.createdBy !== adminId) {
            throw new ForbiddenException('You can only assign users to your own projects');
        }

        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Check if user is already assigned
        const existingAssignment = await this.prisma.projectUser.findFirst({
            where: {
                projectId,
                userId,
            },
        });

        if (existingAssignment) {
            throw new ConflictException('User is already assigned to this project');
        }

        this.logger.debug(`Assigning user ${user.email} to project ${project.name}`);

        await this.prisma.projectUser.create({
            data: {
                projectId,
                userId,
            },
        });

        this.logger.log(`User ${user.email} assigned to project ${project.name} (ID: ${projectId})`);
    }

    async removeUser(projectId: number, userId: number, adminId: number): Promise<void> {
        const project = await this.findOne(projectId);

        if (!project) {
            throw new NotFoundException(`Project with ID ${projectId} not found`);
        }

        // Verify the admin owns this project
        if (project.createdBy !== adminId) {
            throw new ForbiddenException('You can only remove users from your own projects');
        }

        // Find the assignment
        const assignment = await this.prisma.projectUser.findFirst({
            where: {
                projectId,
                userId,
            },
        });

        if (!assignment) {
            throw new BadRequestException('User is not assigned to this project');
        }

        this.logger.debug(`Removing user ID ${userId} from project ${project.name}`);

        await this.prisma.projectUser.delete({
            where: { id: assignment.id },
        });

        this.logger.log(`User ID ${userId} removed from project ${project.name} (ID: ${projectId})`);
    }
}
