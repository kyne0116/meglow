import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { CurrentParent } from '../interfaces/current-parent.interface';

export const CurrentParentContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentParent => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.currentParent as CurrentParent;
  },
);
