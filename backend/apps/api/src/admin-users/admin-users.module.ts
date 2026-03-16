import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuditModule } from '../admin-audit/admin-audit.module';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { getRuntimeJwtSecret } from '../config/runtime-config';
import { PersistenceModule } from '../persistence/persistence.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [
    PersistenceModule,
    AdminAuditModule,
    JwtModule.register({
      secret: getRuntimeJwtSecret(),
    }),
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminJwtAuthGuard, AdminRolesGuard],
})
export class AdminUsersModule {}
