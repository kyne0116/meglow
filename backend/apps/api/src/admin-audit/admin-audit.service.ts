import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../persistence/prisma/prisma.service';

export interface AdminAuditLogRecord {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  payload: Record<string, unknown> | null;
  adminUserId: string;
  adminUsername: string;
  adminDisplayName: string;
  createdAt: string;
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prismaService: PrismaService) {}

  async recordLog(entry: {
    adminUserId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    summary: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await this.prismaService.adminAuditLog.create({
      data: {
        adminUserId: entry.adminUserId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        summary: entry.summary,
        payloadJson: entry.payload ? (entry.payload as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async listLogs(filters: {
    action?: string;
    targetType?: string;
    limit?: number;
  }): Promise<AdminAuditLogRecord[]> {
    const logs = await this.prismaService.adminAuditLog.findMany({
      where: {
        ...(filters.action ? { action: filters.action.trim() } : {}),
        ...(filters.targetType ? { targetType: filters.targetType.trim() } : {}),
      },
      include: {
        adminUser: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: filters.limit ?? 50,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      summary: log.summary,
      payload: (log.payloadJson as Record<string, unknown> | null) ?? null,
      adminUserId: log.adminUserId,
      adminUsername: log.adminUser.username,
      adminDisplayName: log.adminUser.displayName,
      createdAt: log.createdAt.toISOString(),
    }));
  }
}
