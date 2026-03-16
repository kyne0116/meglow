import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRuntimeJwtSecret } from '../../config/runtime-config';
import {
  createUnauthorizedException,
  requireBearerToken,
} from '../auth/request-auth';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { CurrentParent } from '../interfaces/current-parent.interface';

type JwtParentPayload = CurrentParent & {
  exp?: number;
  iat?: number;
};

function isValidParentPayload(payload: JwtParentPayload): payload is CurrentParent {
  return (
    typeof payload.parentId === 'string' &&
    payload.parentId.length > 0 &&
    typeof payload.familyId === 'string' &&
    payload.familyId.length > 0 &&
    typeof payload.phone === 'string' &&
    payload.phone.length > 0 &&
    (payload.role === 'OWNER' || payload.role === 'MEMBER')
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = requireBearerToken(request.headers.authorization);

    try {
      const payload = await this.jwtService.verifyAsync<JwtParentPayload>(token, {
        secret: getRuntimeJwtSecret(),
      });
      if (!isValidParentPayload(payload)) {
        throw new Error('invalid payload');
      }

      request.currentParent = {
        parentId: payload.parentId,
        familyId: payload.familyId,
        phone: payload.phone,
        role: payload.role,
      };
      return true;
    } catch {
      throw createUnauthorizedException('invalid access token');
    }
  }
}
