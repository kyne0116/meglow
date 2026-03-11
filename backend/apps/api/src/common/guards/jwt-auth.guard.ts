import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DEFAULT_JWT_SECRET } from '../../auth/auth.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { CurrentParent } from '../interfaces/current-parent.interface';

type JwtParentPayload = CurrentParent & {
  exp?: number;
  iat?: number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : '';

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'missing bearer token',
        details: {},
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtParentPayload>(token, {
        secret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
      });

      request.currentParent = {
        parentId: payload.parentId,
        familyId: payload.familyId,
        phone: payload.phone,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'invalid access token',
        details: {},
      });
    }
  }
}
