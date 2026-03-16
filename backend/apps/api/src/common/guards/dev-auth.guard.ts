import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { DevDataService } from '../../dev-data/dev-data.service';
import {
  createUnauthorizedException,
  requireBearerToken,
} from '../auth/request-auth';
import { AuthSession } from '../interfaces/auth-session.interface';

type RequestWithAuthSession = Request & {
  authSession?: AuthSession;
};

function isValidAuthSession(session: AuthSession): session is AuthSession {
  return (
    typeof session.token === 'string' &&
    session.token.length > 0 &&
    typeof session.parentId === 'string' &&
    session.parentId.length > 0 &&
    typeof session.familyId === 'string' &&
    session.familyId.length > 0 &&
    typeof session.phone === 'string' &&
    session.phone.length > 0 &&
    (session.role === 'OWNER' || session.role === 'MEMBER')
  );
}

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly devDataService: DevDataService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthSession>();
    const token = requireBearerToken(request.headers.authorization);

    const session = this.devDataService.getSession(token);
    if (!session) {
      throw createUnauthorizedException('invalid session token');
    }
    if (!isValidAuthSession(session)) {
      throw createUnauthorizedException('invalid session token');
    }

    request.authSession = session;
    return true;
  }
}
