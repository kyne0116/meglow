import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentAdmin = request.currentAdmin;

    if (!currentAdmin) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'admin session required',
        details: {},
      });
    }
    if (currentAdmin.role === AdminRole.SUPER_ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(currentAdmin.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'admin role not allowed',
        details: {
          requiredRoles,
          currentRole: currentAdmin.role,
        },
      });
    }

    return true;
  }
}
