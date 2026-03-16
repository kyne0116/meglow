import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { ListAdminAuditLogsQueryDto } from './dto/list-admin-audit-logs-query.dto';
import { AdminAuditLogRecord, AdminAuditService } from './admin-audit.service';

@ApiTags('admin-audit')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('admin-audit')
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER, AdminRole.VIEWER)
  @Get('logs')
  listLogs(@Query() query: ListAdminAuditLogsQueryDto): Promise<AdminAuditLogRecord[]> {
    return this.adminAuditService.listLogs(query);
  }
}
