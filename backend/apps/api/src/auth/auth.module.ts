import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getRuntimeJwtSecret } from '../config/runtime-config';
import { ACCESS_TOKEN_EXPIRES_IN } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: getRuntimeJwtSecret(),
        signOptions: {
          expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
