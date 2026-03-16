import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DevDataService } from '../../dev-data/dev-data.service';
import { DevAuthGuard } from './dev-auth.guard';

type GuardRequest = {
  headers: { authorization?: string };
  authSession?: unknown;
};

function createExecutionContext(request: GuardRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('DevAuthGuard', () => {
  test('attaches authSession for a valid dev session token', () => {
    const request: GuardRequest = {
      headers: { authorization: 'Bearer dev-token' },
    };
    const devDataService = {
      getSession: jest.fn().mockReturnValue({
        token: 'dev-token',
        parentId: 'parent-1',
        familyId: 'family-1',
        phone: '13800138000',
        role: 'OWNER',
      }),
    } as unknown as DevDataService;
    const guard = new DevAuthGuard(devDataService);

    expect(guard.canActivate(createExecutionContext(request))).toBe(true);
    expect(request.authSession).toEqual({
      token: 'dev-token',
      parentId: 'parent-1',
      familyId: 'family-1',
      phone: '13800138000',
      role: 'OWNER',
    });
  });

  test('rejects a session object when required fields are missing', () => {
    const request: GuardRequest = {
      headers: { authorization: 'Bearer dev-token' },
    };
    const devDataService = {
      getSession: jest.fn().mockReturnValue({
        token: 'dev-token',
        familyId: 'family-1',
        phone: '13800138000',
        role: 'OWNER',
      }),
    } as unknown as DevDataService;
    const guard = new DevAuthGuard(devDataService);

    expect(() => guard.canActivate(createExecutionContext(request))).toThrow(
      UnauthorizedException,
    );
  });
});
