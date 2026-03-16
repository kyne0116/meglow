import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import { AdminRolesGuard } from './admin-roles.guard';

type GuardRequest = {
  currentAdmin?: {
    adminUserId: string;
    username: string;
    role: AdminRole;
  };
};

function createExecutionContext(request: GuardRequest): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => class TestClass {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AdminRolesGuard', () => {
  test('allows requests when no roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new AdminRolesGuard(reflector);

    expect(guard.canActivate(createExecutionContext({}))).toBe(true);
  });

  test('allows SUPER_ADMIN even when the required roles do not list it explicitly', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([AdminRole.CONTENT_EDITOR]),
    } as unknown as Reflector;
    const guard = new AdminRolesGuard(reflector);

    expect(
      guard.canActivate(
        createExecutionContext({
          currentAdmin: {
            adminUserId: 'admin-1',
            username: 'admin',
            role: AdminRole.SUPER_ADMIN,
          },
        }),
      ),
    ).toBe(true);
  });

  test('rejects non-matching non-super-admin roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([AdminRole.CONTENT_PUBLISHER]),
    } as unknown as Reflector;
    const guard = new AdminRolesGuard(reflector);

    expect(() =>
      guard.canActivate(
        createExecutionContext({
          currentAdmin: {
            adminUserId: 'admin-1',
            username: 'editor',
            role: AdminRole.CONTENT_EDITOR,
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
