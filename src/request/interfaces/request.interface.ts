import { UserRequest } from '@prisma/client';

export interface IRequestService {
    createRequest(userId: number, createRequestDto: any): Promise<UserRequest>;
    findAllByUser(userId: number): Promise<UserRequest[]>;
    findAllByAdmin(adminId: number): Promise<UserRequest[]>;
    findOne(id: number): Promise<UserRequest | null>;
    approveRequest(id: number, adminId: number): Promise<UserRequest>;
    rejectRequest(id: number, adminId: number): Promise<UserRequest>;
}

export interface RequestWithRelations extends UserRequest {
    user?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    admin?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}
