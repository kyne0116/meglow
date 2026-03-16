import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

type GuardRequest = {
  headers: { authorization?: string };
  currentParent?: unknown;
};

function createExecutionContext(request: {
  headers: { authorization?: string };
  currentParent?: unknown;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  test('attaches currentParent for a valid parent token payload', async () => {
    const request: GuardRequest = {
      headers: { authorization: 'Bearer parent-token' },
    };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        parentId: 'parent-1',
        familyId: 'family-1',
        phone: '13800138000',
        role: 'OWNER',
      }),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(request.currentParent).toEqual({
      parentId: 'parent-1',
      familyId: 'family-1',
      phone: '13800138000',
      role: 'OWNER',
    });
  });

  test('rejects a verified payload when required parent fields are missing', async () => {
    const request: GuardRequest = {
      headers: { authorization: 'Bearer parent-token' },
    };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        familyId: 'family-1',
        phone: '13800138000',
        role: 'OWNER',
      }),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(jwtService);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
