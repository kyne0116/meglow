import { AuthSession } from '../interfaces/auth-session.interface';
import { CurrentAdmin } from '../interfaces/current-admin.interface';
import { CurrentParent } from '../interfaces/current-parent.interface';
import { createUnauthorizedException } from './request-auth';

export function requireCurrentParent(request: {
  currentParent?: CurrentParent;
}): CurrentParent {
  if (request.currentParent) {
    return request.currentParent;
  }

  throw createUnauthorizedException('invalid access token');
}

export function requireCurrentAdmin(request: {
  currentAdmin?: CurrentAdmin;
}): CurrentAdmin {
  if (request.currentAdmin) {
    return request.currentAdmin;
  }

  throw createUnauthorizedException('invalid admin access token');
}

export function requireAuthSession(request: {
  authSession?: AuthSession;
}): AuthSession {
  if (request.authSession) {
    return request.authSession;
  }

  throw createUnauthorizedException('invalid session token');
}
