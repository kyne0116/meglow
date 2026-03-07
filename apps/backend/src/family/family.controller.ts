import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { InviteParentDto } from "./dto/invite-parent.dto";
import { FamilyService } from "./family.service";

@UseGuards(JwtAuthGuard)
@Controller("family")
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get("me")
  async getMyFamily(@CurrentUser() user: JwtPayload): Promise<{
    id: string;
    name: string;
    parents: Array<{ id: string; phone: string; nickname: string; role: string }>;
  }> {
    return this.familyService.getFamily(user);
  }

  @Post("invite")
  async inviteParent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteParentDto
  ): Promise<{ invitedParentId: string; familyId: string }> {
    return this.familyService.inviteParent(user, dto);
  }
}
