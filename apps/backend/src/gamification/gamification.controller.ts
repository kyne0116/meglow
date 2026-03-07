import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { GamificationService } from "./gamification.service";

@UseGuards(JwtAuthGuard)
@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get(":childId")
  async getProfile(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string
  ): Promise<{ childId: string; points: number; level: number; streakDays: number }> {
    return this.gamificationService.getProfile(user, childId);
  }
}
