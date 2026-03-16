import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AdminAuditService } from '../admin-audit/admin-audit.service';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { CurrentAdminContext } from '../common/decorators/current-admin.decorator';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { CurrentAdmin } from '../common/interfaces/current-admin.interface';
import { AdminUserRecord, AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags('admin-users')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@AdminRoles(AdminRole.SUPER_ADMIN)
@Controller('admin-users')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  @Get()
  listAdminUsers(@Query() query: ListAdminUsersQueryDto): Promise<AdminUserRecord[]> {
    return this.adminUsersService.listAdminUsers(query);
  }

  @Post()
  async createAdminUser(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Body() payload: CreateAdminUserDto,
  ): Promise<AdminUserRecord> {
    const adminUser = await this.adminUsersService.createAdminUser(payload);
    await this.adminAuditService.recordLog({
      adminUserId: currentAdmin.adminUserId,
      action: 'ADMIN_USER_CREATED',
      targetType: 'ADMIN_USER',
      targetId: adminUser.id,
      summary: `创建管理员 ${adminUser.username}`,
      payload: {
        role: adminUser.role,
      },
    });
    return adminUser;
  }

  @Patch(':adminUserId')
  async updateAdminUser(
    @CurrentAdminContext() currentAdmin: CurrentAdmin,
    @Param('adminUserId') adminUserId: string,
    @Body() payload: UpdateAdminUserDto,
  ): Promise<AdminUserRecord> {
    const adminUser = await this.adminUsersService.updateAdminUser(
      adminUserId,
      payload,
      currentAdmin.adminUserId,
    );
    await this.adminAuditService.recordLog({
      adminUserId: currentAdmin.adminUserId,
      action: 'ADMIN_USER_UPDATED',
      targetType: 'ADMIN_USER',
      targetId: adminUser.id,
      summary: `更新管理员 ${adminUser.username}`,
      payload: {
        role: payload.role,
        isEnabled: payload.isEnabled,
        passwordReset: Boolean(payload.password),
      },
    });
    return adminUser;
  }
}
