import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { getRuntimeJwtSecret } from '../../config/runtime-config';
import {
  createUnauthorizedException,
  requireBearerToken,
} from '../auth/request-auth';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

type JwtAdminPayload = {
  adminUserId: string;
  username: string;
  role: AdminRole;
  scope: 'admin';
  exp?: number;
  iat?: number;
};

function isValidAdminPayload(
  payload: JwtAdminPayload,
): payload is Omit<JwtAdminPayload, 'exp' | 'iat'> {
  return (
    typeof payload.adminUserId === 'string' &&
    payload.adminUserId.length > 0 &&
    typeof payload.username === 'string' &&
    payload.username.length > 0 &&
    Object.values(AdminRole).includes(payload.role)
  );
}

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = requireBearerToken(request.headers.authorization);

    try {
      const payload = await this.jwtService.verifyAsync<JwtAdminPayload>(token, {
        secret: getRuntimeJwtSecret(),
      });

      if (payload.scope !== 'admin') {
        throw new Error('invalid scope');
      }
      if (!isValidAdminPayload(payload)) {
        throw new Error('invalid payload');
      }

      request.currentAdmin = {
        adminUserId: payload.adminUserId,
        username: payload.username,
        role: payload.role,
      };

      return true;
    } catch {
      throw createUnauthorizedException('invalid admin access token');
    }
  }
}
