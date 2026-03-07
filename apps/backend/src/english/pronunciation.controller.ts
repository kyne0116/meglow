import { Controller, Get, Param, Post, Body, UseGuards } from "@nestjs/common";
import { LearningSessionStatus, LearningType } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { StartScenarioSessionDto } from "./dto/start-scenario-session.dto";
import { SubmitPronunciationInputDto } from "./dto/submit-pronunciation-input.dto";
import { PronunciationService } from "./pronunciation.service";

@UseGuards(JwtAuthGuard)
@Controller("english/pronunciation")
export class PronunciationController {
  constructor(private readonly pronunciationService: PronunciationService) {}

  @Post("session/start")
  async start(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartScenarioSessionDto
  ): Promise<{
    sessionId: string;
    type: LearningType;
    status: LearningSessionStatus;
    startedAt: Date;
  }> {
    return this.pronunciationService.start(user, dto);
  }

  @Post("session/:sessionId/submit")
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param("sessionId") sessionId: string,
    @Body() dto: SubmitPronunciationInputDto
  ): Promise<{
    sessionId: string;
    inputs: number;
    score: number;
    feedback: string;
    correction: string;
    nextAction: string;
  }> {
    return this.pronunciationService.submit(user, sessionId, dto);
  }

  @Post("session/:sessionId/end")
  async end(
    @CurrentUser() user: JwtPayload,
    @Param("sessionId") sessionId: string
  ): Promise<{
    sessionId: string;
    type: LearningType;
    status: LearningSessionStatus;
    averageScore: number;
    durationSec: number;
  }> {
    return this.pronunciationService.end(user, sessionId);
  }

  @Get("progress/:childId")
  async progress(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string
  ): Promise<{
    childId: string;
    type: LearningType;
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
  }> {
    return this.pronunciationService.progress(user, childId);
  }
}
