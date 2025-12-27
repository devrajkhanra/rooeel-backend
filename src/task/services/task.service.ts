import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class TaskService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createTaskDto: CreateTaskDto, adminId: number) {
        // Verify project existence and ownership
        const project = await this.prisma.project.findUnique({
            where: { id: createTaskDto.projectId },
        });

        if (!project) {
            throw new NotFoundException(`Project with ID ${createTaskDto.projectId} not found`);
        }

        if (project.createdBy !== adminId) {
            throw new ForbiddenException('You can only add tasks to projects you created');
        }

        return this.prisma.task.create({
            data: {
                ...createTaskDto,
            },
        });
    }

    async findAll(user: any) {
        if (user.role === 'admin') {
            // Admin sees all tasks in their projects
            return this.prisma.task.findMany({
                where: {
                    project: {
                        createdBy: user.userId,
                    },
                },
                include: {
                    project: true,
                    assignee: true,
                },
            });
        } else {
            // User sees tasks assigned to them
            return this.prisma.task.findMany({
                where: {
                    assignedTo: user.userId,
                },
                include: {
                    project: true,
                },
            });
        }
    }

    async findOne(id: number) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                assignee: true,
            },
        });

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }

        return task;
    }

    async update(id: number, updateTaskDto: UpdateTaskDto, user: any) {
        const task = await this.findOne(id);

        if (user.role === 'admin') {
            // Admin checks ownership
            if (task.project.createdBy !== user.userId) {
                throw new ForbiddenException('You can only update tasks in your projects');
            }
            return this.prisma.task.update({
                where: { id },
                data: updateTaskDto,
            });
        } else {
            // User can only update status of assigned tasks
            if (task.assignedTo !== user.userId) {
                throw new ForbiddenException('You can only update tasks assigned to you');
            }

            // Users can ONLY update status
            // Users can ONLY update status or submissionData
            const allowedUpdates = ['status', 'submissionData'];
            const updates = Object.keys(updateTaskDto);
            const isAllowed = updates.every(update => allowedUpdates.includes(update));

            if (!isAllowed) {
                throw new ForbiddenException('Users can only update task status or submit form data');
            }

            return this.prisma.task.update({
                where: { id },
                data: updateTaskDto,
            });
        }
    }

    async remove(id: number, adminId: number) {
        const task = await this.findOne(id);

        if (task.project.createdBy !== adminId) {
            throw new ForbiddenException('You can only delete tasks in your projects');
        }

        return this.prisma.task.delete({
            where: { id },
        });
    }
}
