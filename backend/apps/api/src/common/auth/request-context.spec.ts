import { UnauthorizedException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import {
  requireCurrentAdmin,
  requireCurrentParent,
  requireAuthSession,
} from './request-context';

describe('request-context', () => {
  test('requireCurrentParent returns the current parent context when present', () => {
    expect(
      requireCurrentParent({
        currentParent: {
          parentId: 'parent-1',
          familyId: 'family-1',
          phone: '13800138000',
          role: 'OWNER',
        },
      }),
    ).toEqual({
      parentId: 'parent-1',
      familyId: 'family-1',
      phone: '13800138000',
      role: 'OWNER',
    });
  });

  test('requireCurrentParent throws when the parent context is missing', () => {
    expect(() => requireCurrentParent({})).toThrow(UnauthorizedException);
    expect(() => requireCurrentParent({})).toThrow('invalid access token');
  });

  test('requireCurrentAdmin returns the current admin context when present', () => {
    expect(
      requireCurrentAdmin({
        currentAdmin: {
          adminUserId: 'admin-1',
          username: 'admin',
          role: AdminRole.SUPER_ADMIN,
        },
      }),
    ).toEqual({
      adminUserId: 'admin-1',
      username: 'admin',
      role: AdminRole.SUPER_ADMIN,
    });
  });

  test('requireCurrentAdmin throws when the admin context is missing', () => {
    expect(() => requireCurrentAdmin({})).toThrow(UnauthorizedException);
    expect(() => requireCurrentAdmin({})).toThrow('invalid admin access token');
  });

  test('requireAuthSession returns the auth session when present', () => {
    expect(
      requireAuthSession({
        authSession: {
          token: 'dev-token',
          parentId: 'parent-1',
          familyId: 'family-1',
          phone: '13800138000',
          role: 'OWNER',
        },
      }),
    ).toEqual({
      token: 'dev-token',
      parentId: 'parent-1',
      familyId: 'family-1',
      phone: '13800138000',
      role: 'OWNER',
    });
  });

  test('requireAuthSession throws when the auth session is missing', () => {
    expect(() => requireAuthSession({})).toThrow(UnauthorizedException);
    expect(() => requireAuthSession({})).toThrow('invalid session token');
  });
});
