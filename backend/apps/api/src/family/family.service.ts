import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ParentRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { AcceptFamilyInviteDto } from './dto/accept-family-invite.dto';
import { InviteParentDto } from './dto/invite-parent.dto';

@Injectable()
export class FamilyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async inviteParent(
    currentParent: CurrentParent,
    payload: InviteParentDto,
  ): Promise<{ inviteId: string; token: string; expiresAt: string }> {
    const family = await this.prismaService.family.findUnique({
      where: {
        id: currentParent.familyId,
      },
      include: {
        memberships: {
          include: {
            parent: {
              select: {
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!family) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'family not found',
        details: {},
      });
    }

    if (family.memberships.length >= 2) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'family parent limit reached',
        details: {},
      });
    }

    if (payload.phone === currentParent.phone) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'cannot invite current parent',
        details: {},
      });
    }

    if (family.memberships.some((membership) => membership.parent.phone === payload.phone)) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'parent already joined the family',
        details: {},
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = randomUUID();
    const invite = await this.prismaService.familyInvite.create({
      data: {
        familyId: currentParent.familyId,
        inviterParentId: currentParent.parentId,
        inviteePhone: payload.phone,
        token,
        expiresAt,
      },
    });

    return {
      inviteId: invite.id,
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  async acceptInvite(payload: AcceptFamilyInviteDto): Promise<{
    accessToken: string;
    expiresIn: string;
    parentId: string;
    familyId: string;
  }> {
    return this.prismaService.$transaction(async (prisma) => {
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

      const invite = await prisma.familyInvite.findUnique({
        where: {
          token: payload.token,
        },
      });

      if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'family invite not found',
          details: {},
        });
      }

      if (invite.inviteePhone !== payload.phone) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'invite phone does not match login phone',
          details: {},
        });
      }

      const familyMembershipCount = await prisma.familyMembership.count({
        where: {
          familyId: invite.familyId,
        },
      });

      if (familyMembershipCount >= 2) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'family parent limit reached',
          details: {},
        });
      }

      let parent = await prisma.parent.findUnique({
        where: {
          phone: payload.phone,
        },
        include: {
          memberships: true,
        },
      });

      if (parent && parent.memberships.some((membership) => membership.familyId !== invite.familyId)) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'parent already belongs to another family',
          details: {},
        });
      }

      if (!parent) {
        parent = await prisma.parent.create({
          data: {
            phone: payload.phone,
          },
          include: {
            memberships: true,
          },
        });
      }

      if (!parent.memberships.some((membership) => membership.familyId === invite.familyId)) {
        await prisma.familyMembership.create({
          data: {
            familyId: invite.familyId,
            parentId: parent.id,
            role: ParentRole.MEMBER,
            invitedByParentId: invite.inviterParentId,
          },
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

      await prisma.familyInvite.update({
        where: {
          id: invite.id,
        },
        data: {
          acceptedAt: new Date(),
        },
      });

      return this.authService.acceptInviteLogin(prisma, {
        parentId: parent.id,
        familyId: invite.familyId,
        phone: parent.phone,
        role: 'MEMBER',
      });
    });
  }
}
