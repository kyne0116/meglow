import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DevDataService } from '../../dev-data/dev-data.service';
import { AuthSession } from '../interfaces/auth-session.interface';

type RequestWithAuthSession = Request & {
  authSession?: AuthSession;
};

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly devDataService: DevDataService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthSession>();
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

    const session = this.devDataService.getSession(token);
    if (!session) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'invalid session token',
        details: {},
      });
    }

    request.authSession = session;
    return true;
  }
}
