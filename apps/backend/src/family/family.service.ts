import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ParentRole } from "@prisma/client";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";
import { InviteParentDto } from "./dto/invite-parent.dto";

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async getFamily(user: JwtPayload): Promise<{
    id: string;
    name: string;
    parents: Array<{ id: string; phone: string; nickname: string; role: string }>;
  }> {
    const family = await this.prisma.family.findUnique({
      where: { id: user.familyId },
      include: { parents: true }
    });

    if (!family) {
      throw new NotFoundException("家庭不存在");
    }

    return {
      id: family.id,
      name: family.name,
      parents: family.parents.map((item) => ({
        id: item.id,
        phone: item.phone,
        nickname: item.nickname,
        role: item.role
      }))
    };
  }

  async inviteParent(
    user: JwtPayload,
    dto: InviteParentDto
  ): Promise<{ invitedParentId: string; familyId: string }> {
    const family = await this.prisma.family.findUnique({
      where: { id: user.familyId },
      include: { parents: true }
    });
    if (!family) {
      throw new NotFoundException("家庭不存在");
    }

    const existing = await this.prisma.parent.findUnique({
      where: { phone: dto.phone }
    });
    if (existing) {
      throw new BadRequestException("手机号已被注册");
    }

    if (family.parents.length >= 2) {
      throw new BadRequestException("当前家庭已达到家长人数上限");
    }

    const parent = await this.prisma.parent.create({
      data: {
        familyId: family.id,
        phone: dto.phone,
        nickname: `家长${dto.phone.slice(-4)}`,
        role: ParentRole.SECONDARY
      }
    });

    return { invitedParentId: parent.id, familyId: family.id };
  }
}
