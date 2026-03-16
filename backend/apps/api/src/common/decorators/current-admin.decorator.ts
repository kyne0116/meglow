import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { CurrentAdmin } from '../interfaces/current-admin.interface';
import { requireCurrentAdmin } from '../auth/request-context';

export const CurrentAdminContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentAdmin => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return requireCurrentAdmin(request);
  },
);
