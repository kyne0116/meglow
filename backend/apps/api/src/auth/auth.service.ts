import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ParentRole, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ACCESS_TOKEN_EXPIRES_IN } from './auth.constants';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendCode(
    payload: SendVerificationCodeDto,
  ): Promise<{ success: true; expiresInSec: number }> {
    const now = new Date();
    const recentCode = await this.prismaService.verificationCode.findFirst({
      where: {
        phone: payload.phone,
        createdAt: {
          gte: new Date(now.getTime() - 60_000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentCode) {
      throw new ConflictException({
        code: 'RATE_LIMITED',
        message: 'verification code requested too frequently',
        details: {},
      });
    }

    await this.prismaService.verificationCode.create({
      data: {
        phone: payload.phone,
        code: '123456',
        expiresAt: new Date(now.getTime() + 60_000),
      },
    });

    return { success: true, expiresInSec: 60 };
  }

  async login(payload: LoginDto): Promise<{
    accessToken: string;
    expiresIn: string;
    parentId: string;
    familyId: string;
  }> {
    const currentParent = await this.prismaService.$transaction(async (prisma) => {
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          phone: payload.phone,
          code: payload.verificationCode,
          expiresAt: {
            gte: new Date(),
          },
          usedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!verificationCode) {
        throw new UnauthorizedException({
          code: 'UNAUTHORIZED',
          message: 'invalid verification code',
          details: {},
        });
      }

      await prisma.verificationCode.update({
        where: {
          id: verificationCode.id,
        },
        data: {
          usedAt: new Date(),
        },
      });

      let parent = await prisma.parent.findUnique({
        where: {
          phone: payload.phone,
        },
        include: {
          memberships: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!parent) {
        const family = await prisma.family.create({
          data: {},
        });

        parent = await prisma.parent.create({
          data: {
            phone: payload.phone,
            memberships: {
              create: {
                familyId: family.id,
                role: ParentRole.OWNER,
              },
            },
          },
          include: {
            memberships: true,
          },
        });
      }

      const membership = parent.memberships[0];
      if (!membership) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'family membership not found',
          details: {},
        });
      }

      return {
        parentId: parent.id,
        familyId: membership.familyId,
        phone: parent.phone,
        role: membership.role,
      } satisfies CurrentParent;
    });

    return this.buildLoginResponse(currentParent);
  }

  async getCurrentParentProfile(currentParent: CurrentParent): Promise<{
    parentId: string;
    familyId: string;
    phone: string;
    nickname: string | null;
    role: 'OWNER' | 'MEMBER';
  }> {
    const parent = await this.prismaService.parent.findUnique({
      where: {
        id: currentParent.parentId,
      },
      select: {
        nickname: true,
      },
    });

    return {
      parentId: currentParent.parentId,
      familyId: currentParent.familyId,
      phone: currentParent.phone,
      nickname: parent?.nickname ?? null,
      role: currentParent.role,
    };
  }

  async acceptInviteLogin(
    tx: Prisma.TransactionClient,
    currentParent: CurrentParent,
  ): Promise<{
    accessToken: string;
    expiresIn: string;
    parentId: string;
    familyId: string;
  }> {
    const parent = await tx.parent.findUnique({
      where: {
        id: currentParent.parentId,
      },
      select: {
        id: true,
      },
    });

    if (!parent) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'parent not found',
        details: {},
      });
    }

    return this.buildLoginResponse(currentParent);
  }

  private async buildLoginResponse(currentParent: CurrentParent): Promise<{
    accessToken: string;
    expiresIn: string;
    parentId: string;
    familyId: string;
  }> {
    const accessToken = await this.jwtService.signAsync({
      parentId: currentParent.parentId,
      familyId: currentParent.familyId,
      phone: currentParent.phone,
      role: currentParent.role,
      jti: randomUUID(),
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      parentId: currentParent.parentId,
      familyId: currentParent.familyId,
    };
  }
}
