import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { BriefingService } from "./briefing.service";

@UseGuards(JwtAuthGuard)
@Controller("briefings")
export class BriefingController {
  constructor(private readonly briefingService: BriefingService) {}

  @Get(":childId")
  async listByChild(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string
  ): Promise<
    Array<{ id: string; headline: string; accuracy: number; summary: string; createdAt: Date }>
  > {
    return this.briefingService.listByChild(user, childId);
  }
}
