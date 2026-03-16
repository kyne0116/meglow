import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import {
  AdminContentItemRecord,
  AdminContentItemVersionRecord,
  AdminContentService,
} from './admin-content.service';
import { ListAdminContentItemsQueryDto } from './dto/list-admin-content-items-query.dto';

@ApiTags('admin-content')
@UseGuards(AdminJwtAuthGuard)
@Controller('admin-content')
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get('content-items')
  listContentItems(
    @Query() query: ListAdminContentItemsQueryDto,
  ): Promise<AdminContentItemRecord[]> {
    return this.adminContentService.listContentItems(query);
  }

  @Get('content-items/:contentItemId/versions')
  listContentItemVersions(
    @Param('contentItemId') contentItemId: string,
  ): Promise<AdminContentItemVersionRecord[]> {
    return this.adminContentService.listContentItemVersions(contentItemId);
  }
}
