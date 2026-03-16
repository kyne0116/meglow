import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthSession } from '../interfaces/auth-session.interface';
import { requireAuthSession } from '../auth/request-context';

type RequestWithAuthSession = Request & {
  authSession?: AuthSession;
};

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSession => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuthSession>();
    return requireAuthSession(request);
  },
);
