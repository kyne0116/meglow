import { UnauthorizedException } from '@nestjs/common';

const BEARER_PREFIX = 'Bearer ';

export function createUnauthorizedException(message: string): UnauthorizedException {
  return new UnauthorizedException({
    code: 'UNAUTHORIZED',
    message,
    details: {},
  });
}

export function extractBearerToken(authHeader?: string): string {
  if (
    !authHeader ||
    authHeader.slice(0, BEARER_PREFIX.length).toLowerCase() !==
      BEARER_PREFIX.toLowerCase()
  ) {
    return '';
  }

  return authHeader.slice(BEARER_PREFIX.length).trim();
}

export function requireBearerToken(authHeader?: string): string {
  const token = extractBearerToken(authHeader);
  if (token) {
    return token;
  }

  throw createUnauthorizedException('missing bearer token');
}
