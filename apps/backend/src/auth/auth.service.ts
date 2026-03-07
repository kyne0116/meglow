import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ParentRole } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

interface LoginResult {
  accessToken: string;
  expiresIn: string;
  parentId: string;
  familyId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    if (dto.verificationCode !== "123456") {
      throw new UnauthorizedException("验证码错误，开发环境默认验证码为 123456");
    }

    let parent = await this.prisma.parent.findUnique({
      where: { phone: dto.phone }
    });

    if (!parent) {
      parent = await this.createPrimaryParent(dto.phone);
    }

    const payload: JwtPayload = {
      sub: parent.id,
      familyId: parent.familyId,
      phone: parent.phone
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: "7d",
      parentId: parent.id,
      familyId: parent.familyId
    };
  }

  private async createPrimaryParent(phone: string) {
    const family = await this.prisma.family.create({
      data: {
        name: `家庭-${phone.slice(-4)}`
      }
    });

    return this.prisma.parent.create({
      data: {
        familyId: family.id,
        phone,
        nickname: `家长${phone.slice(-4)}`,
        role: ParentRole.PRIMARY
      }
    });
  }
}
