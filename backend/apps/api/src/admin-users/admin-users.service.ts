import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { hashPassword } from '../common/utils/password-hash';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

export interface AdminUserRecord {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  isEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async listAdminUsers(filters: {
    role?: AdminRole;
    enabled?: boolean;
    limit?: number;
  }): Promise<AdminUserRecord[]> {
    const adminUsers = await this.prismaService.adminUser.findMany({
      where: {
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.enabled === undefined ? {} : { isEnabled: filters.enabled }),
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      take: filters.limit ?? 50,
    });

    return adminUsers.map((adminUser) => ({
      id: adminUser.id,
      username: adminUser.username,
      displayName: adminUser.displayName,
      role: adminUser.role,
      isEnabled: adminUser.isEnabled,
      lastLoginAt: adminUser.lastLoginAt?.toISOString() ?? null,
      createdAt: adminUser.createdAt.toISOString(),
    }));
  }

  async createAdminUser(payload: CreateAdminUserDto): Promise<AdminUserRecord> {
    try {
      const adminUser = await this.prismaService.adminUser.create({
        data: {
          username: payload.username.trim(),
          displayName: payload.displayName.trim(),
          passwordHash: hashPassword(payload.password),
          role: payload.role,
          isEnabled: true,
        },
      });

      return this.toAdminUserRecord(adminUser);
    } catch (error) {
      this.rethrowConflict(error, 'admin user already exists');
      throw error;
    }
  }

  async updateAdminUser(
    adminUserId: string,
    payload: UpdateAdminUserDto,
    currentAdminUserId: string,
  ): Promise<AdminUserRecord> {
    const existing = await this.prismaService.adminUser.findUnique({
      where: {
        id: adminUserId,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'admin user not found',
        details: {},
      });
    }

    if (existing.id === currentAdminUserId) {
      if (payload.isEnabled === false) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'cannot disable current admin user',
          details: {},
        });
      }

      if (payload.role && payload.role !== existing.role) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'cannot change current admin user role',
          details: {},
        });
      }
    }

    if (
      existing.role === AdminRole.SUPER_ADMIN &&
      payload.isEnabled === false &&
      (await this.countEnabledSuperAdmins()) <= 1
    ) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'at least one enabled super admin is required',
        details: {},
      });
    }

    if (
      existing.role === AdminRole.SUPER_ADMIN &&
      payload.role &&
      payload.role !== AdminRole.SUPER_ADMIN &&
      (await this.countEnabledSuperAdmins()) <= 1
    ) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'at least one enabled super admin is required',
        details: {},
      });
    }

    const adminUser = await this.prismaService.adminUser.update({
      where: {
        id: adminUserId,
      },
      data: {
        ...(payload.displayName === undefined ? {} : { displayName: payload.displayName.trim() }),
        ...(payload.role === undefined ? {} : { role: payload.role }),
        ...(payload.isEnabled === undefined ? {} : { isEnabled: payload.isEnabled }),
        ...(payload.password === undefined ? {} : { passwordHash: hashPassword(payload.password) }),
      },
    });

    return this.toAdminUserRecord(adminUser);
  }

  private async countEnabledSuperAdmins(): Promise<number> {
    return this.prismaService.adminUser.count({
      where: {
        role: AdminRole.SUPER_ADMIN,
        isEnabled: true,
      },
    });
  }

  private toAdminUserRecord(adminUser: {
    id: string;
    username: string;
    displayName: string;
    role: AdminRole;
    isEnabled: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }): AdminUserRecord {
    return {
      id: adminUser.id,
      username: adminUser.username,
      displayName: adminUser.displayName,
      role: adminUser.role,
      isEnabled: adminUser.isEnabled,
      lastLoginAt: adminUser.lastLoginAt?.toISOString() ?? null,
      createdAt: adminUser.createdAt.toISOString(),
    };
  }

  private rethrowConflict(error: unknown, message: string): never | void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      throw new ConflictException({
        code: 'CONFLICT',
        message,
        details: {},
      });
    }
  }
}
