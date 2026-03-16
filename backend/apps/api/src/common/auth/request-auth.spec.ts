import { UnauthorizedException } from '@nestjs/common';
import {
  createUnauthorizedException,
  extractBearerToken,
  requireBearerToken,
} from './request-auth';

describe('request-auth', () => {
  test('extractBearerToken returns the token for a valid bearer header', () => {
    expect(extractBearerToken('Bearer token-123')).toBe('token-123');
    expect(extractBearerToken('bearer token-123')).toBe('token-123');
    expect(extractBearerToken('BEARER token-123')).toBe('token-123');
  });

  test('extractBearerToken returns an empty string for invalid headers', () => {
    expect(extractBearerToken(undefined)).toBe('');
    expect(extractBearerToken('Token token-123')).toBe('');
    expect(extractBearerToken('Bearer    ')).toBe('');
  });

  test('requireBearerToken throws the shared unauthorized error when token is missing', () => {
    expect(() => requireBearerToken(undefined)).toThrow(UnauthorizedException);
    expect(() => requireBearerToken('Token token-123')).toThrow('missing bearer token');
    expect(() => requireBearerToken('Bearer    ')).toThrow('missing bearer token');
  });

  test('createUnauthorizedException returns the shared unauthorized payload shape', () => {
    const exception = createUnauthorizedException('invalid access token');

    expect(exception).toBeInstanceOf(UnauthorizedException);
    expect(exception.getResponse()).toEqual({
      code: 'UNAUTHORIZED',
      message: 'invalid access token',
      details: {},
    });
  });
});
