import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service';

export interface AuditEntryInput {
  action: AuditAction;
  entityType: string;
  entityId: string;
  projectId?: string | null;
  userId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Fire-and-forget audit logging. Failures are logged but never block the
 * primary request — audit trail is best-effort and must not become a
 * source of request failure or added latency on the hot path.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  record(entry: AuditEntryInput): void {
    this.prisma.auditLog
      .create({
        data: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          projectId: entry.projectId ?? null,
          userId: entry.userId ?? null,
          metadata: entry.metadata,
        },
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(`Failed to write audit log: ${message}`);
      });
  }

  async list(projectId: string, take = 50, cursor?: string) {
    return this.prisma.auditLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }
}