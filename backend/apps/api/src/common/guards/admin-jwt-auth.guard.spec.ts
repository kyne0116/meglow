import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminRole } from '@prisma/client';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';

type GuardRequest = {
  headers: { authorization?: string };
  currentAdmin?: unknown;
};

function createExecutionContext(request: GuardRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AdminJwtAuthGuard', () => {
  test('attaches currentAdmin for a valid admin token payload', async () => {
    const request: GuardRequest = {
      headers: { authorization: 'Bearer admin-token' },
    };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        adminUserId: 'admin-1',
        username: 'admin',
        role: AdminRole.SUPER_ADMIN,
        scope: 'admin',
      }),
    } as unknown as JwtService;
    const guard = new AdminJwtAuthGuard(jwtService);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.currentAdmin).toEqual({
      adminUserId: 'admin-1',
      username: 'admin',
      role: AdminRole.SUPER_ADMIN,
    });
  });

  test('rejects a verified payload when required admin fields are missing', async () => {
    const request: GuardRequest = {
      headers: { authorization: 'Bearer admin-token' },
    };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        username: 'admin',
        role: AdminRole.SUPER_ADMIN,
        scope: 'admin',
      }),
    } as unknown as JwtService;
    const guard = new AdminJwtAuthGuard(jwtService);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
