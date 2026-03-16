import { Module } from '@nestjs/common';
import { AdminAuditModule } from '../admin-audit/admin-audit.module';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { AuthModule } from '../auth/auth.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { AdminContentOpsController } from './admin-content-ops.controller';
import { ContentOpsController } from './content-ops.controller';
import { ContentOpsService } from './content-ops.service';

@Module({
  imports: [AuthModule, SubjectsModule, AdminAuditModule],
  controllers: [ContentOpsController, AdminContentOpsController],
  providers: [ContentOpsService, AdminJwtAuthGuard, AdminRolesGuard],
})
export class ContentOpsModule {}
