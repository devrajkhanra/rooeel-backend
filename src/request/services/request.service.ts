import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { IRequestService, RequestWithRelations } from '../interfaces/request.interface';
import { CustomLogger } from '../../logger/logger.service';
import { UserRequest } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RequestService implements IRequestService {
    private readonly logger: CustomLogger;

    constructor(private readonly prisma: PrismaService) {
        this.logger = new CustomLogger();
        this.logger.setContext(RequestService.name);
    }

    async createRequest(userId: number, createRequestDto: CreateRequestDto): Promise<UserRequest> {
        // Get the user to find their admin
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { admin: true },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (!user.createdBy) {
            throw new BadRequestException('User does not have an assigned admin');
        }

        // Validate password change request
        if (createRequestDto.requestType === 'password') {
            if (!createRequestDto.currentPassword) {
                throw new BadRequestException('Current password is required for password change requests');
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(
                createRequestDto.currentPassword,
                user.password
            );

            if (!isPasswordValid) {
                throw new BadRequestException('Current password is incorrect');
            }
        }

        // Get current value
        let currentValue: string | null = null;
        if (createRequestDto.requestType !== 'password') {
            currentValue = user[createRequestDto.requestType as keyof typeof user] as string;
        }

        this.logger.debug(`Creating ${createRequestDto.requestType} change request for user ${user.email}`);

        const request = await this.prisma.userRequest.create({
            data: {
                userId: userId,
                adminId: user.createdBy,
                requestType: createRequestDto.requestType,
                currentValue: currentValue,
                requestedValue: createRequestDto.requestType === 'password' ? '[HIDDEN]' : createRequestDto.requestedValue,
                status: 'pending',
            },
        });

        this.logger.log(`Request created successfully: ${request.requestType} (ID: ${request.id})`);
        return request;
    }

    async findAllByUser(userId: number): Promise<RequestWithRelations[]> {
        return this.prisma.userRequest.findMany({
            where: { userId },
            include: {
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllByAdmin(adminId: number): Promise<RequestWithRelations[]> {
        return this.prisma.userRequest.findMany({
            where: { adminId },
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
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number): Promise<RequestWithRelations | null> {
        return this.prisma.userRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                admin: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    async approveRequest(id: number, adminId: number): Promise<UserRequest> {
        const request = await this.findOne(id);

        if (!request) {
            throw new NotFoundException(`Request with ID ${id} not found`);
        }

        // Verify the admin owns this request
        if (request.adminId !== adminId) {
            throw new ForbiddenException('You can only approve requests from your users');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException(`Request is already ${request.status}`);
        }

        // Password change requests cannot be approved (security measure)
        if (request.requestType === 'password') {
            throw new BadRequestException('Password change requests cannot be approved by admins for security reasons');
        }

        this.logger.debug(`Approving request ${id}: ${request.requestType} change for user ${request.user?.email}`);

        // Update the user's field
        const updateData: any = {};
        updateData[request.requestType] = request.requestedValue;

        await this.prisma.user.update({
            where: { id: request.userId },
            data: updateData,
        });

        // Update request status
        const updatedRequest = await this.prisma.userRequest.update({
            where: { id },
            data: { status: 'approved' },
        });

        this.logger.log(`Request approved successfully: ${request.requestType} for user ${request.user?.email} (ID: ${id})`);
        return updatedRequest;
    }

    async rejectRequest(id: number, adminId: number): Promise<UserRequest> {
        const request = await this.findOne(id);

        if (!request) {
            throw new NotFoundException(`Request with ID ${id} not found`);
        }

        // Verify the admin owns this request
        if (request.adminId !== adminId) {
            throw new ForbiddenException('You can only reject requests from your users');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException(`Request is already ${request.status}`);
        }

        this.logger.debug(`Rejecting request ${id}: ${request.requestType} change for user ${request.user?.email}`);

        const updatedRequest = await this.prisma.userRequest.update({
            where: { id },
            data: { status: 'rejected' },
        });

        this.logger.log(`Request rejected: ${request.requestType} for user ${request.user?.email} (ID: ${id})`);
        return updatedRequest;
    }
}
