import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../common/guards/admin-roles.guard';
import { getRuntimeJwtSecret } from '../config/runtime-config';
import { PersistenceModule } from '../persistence/persistence.module';
import { AdminOverviewController } from './admin-overview.controller';
import { AdminOverviewService } from './admin-overview.service';

@Module({
  imports: [
    PersistenceModule,
    JwtModule.register({
      secret: getRuntimeJwtSecret(),
    }),
  ],
  controllers: [AdminOverviewController],
  providers: [AdminOverviewService, AdminJwtAuthGuard, AdminRolesGuard],
})
export class AdminOverviewModule {}
