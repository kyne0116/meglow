import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CurrentAdmin } from '../common/interfaces/current-admin.interface';
import { verifyPassword } from '../common/utils/password-hash';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { ADMIN_ACCESS_TOKEN_EXPIRES_IN } from './admin-auth.constants';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: AdminLoginDto): Promise<{
    accessToken: string;
    expiresIn: string;
    adminUserId: string;
    username: string;
    displayName: string;
    role: string;
  }> {
    const adminUser = await this.prismaService.adminUser.findUnique({
      where: {
        username: payload.username,
      },
    });

    if (!adminUser || !verifyPassword(payload.password, adminUser.passwordHash)) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'invalid admin credentials',
        details: {},
      });
    }

    if (!adminUser.isEnabled) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'admin user disabled',
        details: {},
      });
    }

    await this.prismaService.adminUser.update({
      where: {
        id: adminUser.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return this.buildLoginResponse({
      adminUserId: adminUser.id,
      username: adminUser.username,
      displayName: adminUser.displayName,
      role: adminUser.role,
    });
  }

  async getCurrentAdminProfile(currentAdmin: CurrentAdmin): Promise<{
    adminUserId: string;
    username: string;
    displayName: string;
    role: string;
  }> {
    const adminUser = await this.prismaService.adminUser.findUnique({
      where: {
        id: currentAdmin.adminUserId,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isEnabled: true,
      },
    });

    if (!adminUser) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'admin user not found',
        details: {},
      });
    }

    if (!adminUser.isEnabled) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'admin user disabled',
        details: {},
      });
    }

    return {
      adminUserId: adminUser.id,
      username: adminUser.username,
      displayName: adminUser.displayName,
      role: adminUser.role,
    };
  }

  private async buildLoginResponse(input: {
    adminUserId: string;
    username: string;
    displayName: string;
    role: AdminRole;
  }): Promise<{
    accessToken: string;
    expiresIn: string;
    adminUserId: string;
    username: string;
    displayName: string;
    role: string;
  }> {
    const accessToken = await this.jwtService.signAsync({
      adminUserId: input.adminUserId,
      username: input.username,
      role: input.role,
      scope: 'admin',
      jti: randomUUID(),
    });

    return {
      accessToken,
      expiresIn: ADMIN_ACCESS_TOKEN_EXPIRES_IN,
      adminUserId: input.adminUserId,
      username: input.username,
      displayName: input.displayName,
      role: input.role,
    };
  }
}
