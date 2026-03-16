import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AdminRoles } from '../common/decorators/admin-roles.decorator';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AdminOverviewService } from './admin-overview.service';

@ApiTags('admin-overview')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('admin-overview')
export class AdminOverviewController {
  constructor(private readonly adminOverviewService: AdminOverviewService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR, AdminRole.CONTENT_PUBLISHER, AdminRole.VIEWER)
  @Get()
  getOverview() {
    return this.adminOverviewService.getOverview();
  }
}
