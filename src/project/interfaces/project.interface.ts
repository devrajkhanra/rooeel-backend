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
        designation?: {
            id: number;
            name: string;
        } | null;
    }[];
}

export interface DesignationWithRelations {
    id: number;
    name: string;
    description: string | null;
    assignedAt: Date;
}

export interface UserWithDesignation {
    id: number;
    firstName: string;
    lastName: string;
    designation: string | null;
}

export interface IProjectService {
    create(adminId: number, createProjectDto: any): Promise<Project>;
    findAll(userId: number, role: string): Promise<ProjectWithRelations[]>;
    findOne(id: number): Promise<ProjectWithRelations | null>;
    update(id: number, adminId: number, updateProjectDto: any): Promise<Project>;
    remove(id: number, adminId: number): Promise<void>;
    assignUser(projectId: number, userId: number, adminId: number): Promise<string[]>;
    removeUser(projectId: number, userId: number, adminId: number): Promise<string[]>;
    assignDesignation(projectId: number, designationId: number, adminId: number): Promise<string[]>;
    removeDesignation(projectId: number, designationId: number, adminId: number): Promise<string[]>;
    getProjectDesignations(projectId: number): Promise<DesignationWithRelations[]>;
    setUserDesignation(projectId: number, userId: number, designationId: number, adminId: number): Promise<UserWithDesignation>;
    removeUserDesignation(projectId: number, userId: number, adminId: number): Promise<UserWithDesignation>;
}
