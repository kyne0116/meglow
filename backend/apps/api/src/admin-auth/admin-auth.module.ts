import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getRuntimeJwtSecret } from '../config/runtime-config';
import { PersistenceModule } from '../persistence/persistence.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [
    PersistenceModule,
    JwtModule.register({
      secret: getRuntimeJwtSecret(),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
