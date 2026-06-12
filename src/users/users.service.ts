import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'argon2';
import { PrismaService } from '../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { CreateAdminUserInput, UpdateAdminUserInput } from './dto/user.inputs';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createUser(input: CreateAdminUserInput, actorUserId: string) {
    const email = input.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const passwordHash = await hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash,
      },
      select: userSelect,
    });

    this.audit.record({
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      userId: actorUserId,
      metadata: { email: user.email },
    });

    return user;
  }

  async listUsers(take = 50, cursor?: string) {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'asc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async updateUser(input: UpdateAdminUserInput, actorUserId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    if (input.email) {
      const email = input.email.toLowerCase();
      if (email !== existing.email) {
        const collision = await this.prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (collision) {
          throw new BadRequestException(
            'A user with this email already exists.',
          );
        }
      }
    }

    const passwordHash = input.password
      ? await hash(input.password)
      : undefined;

    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: {
        firstName: input.firstName?.trim(),
        lastName: input.lastName?.trim(),
        email: input.email?.toLowerCase(),
        status: input.status,
        passwordHash,
      },
      select: userSelect,
    });

    this.audit.record({
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: user.id,
      userId: actorUserId,
    });

    return user;
  }

  async deleteUser(userId: string, actorUserId: string) {
    if (userId === actorUserId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    this.audit.record({
      action: AuditAction.DELETE,
      entityType: 'User',
      entityId: userId,
      userId: actorUserId,
    });

    return true;
  }
}