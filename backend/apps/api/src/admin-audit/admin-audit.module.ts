import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { getRuntimeJwtSecret } from '../config/runtime-config';
import { PersistenceModule } from '../persistence/persistence.module';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from './admin-audit.service';

@Module({
  imports: [
    PersistenceModule,
    JwtModule.register({
      secret: getRuntimeJwtSecret(),
    }),
  ],
  controllers: [AdminAuditController],
  providers: [AdminAuditService, AdminJwtAuthGuard, AdminRolesGuard],
  exports: [AdminAuditService],
})
export class AdminAuditModule {}
