import { Project } from '@prisma/client';

export interface ProjectWithRelations extends Project {
    admin?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    users?: {
        id: number;
        projectId: number;
        userId: number;
        assignedAt: Date;
        user: {
            id: number;
            firstName: string;
            lastName: string;
            email: string;
        };
    }[];
}

export interface IProjectService {
    create(adminId: number, createProjectDto: any): Promise<Project>;
    findAll(userId: number, role: string): Promise<ProjectWithRelations[]>;
    findOne(id: number): Promise<ProjectWithRelations | null>;
    update(id: number, adminId: number, updateProjectDto: any): Promise<Project>;
    remove(id: number, adminId: number): Promise<void>;
    assignUser(projectId: number, userId: number, adminId: number): Promise<void>;
    removeUser(projectId: number, userId: number, adminId: number): Promise<void>;
}
