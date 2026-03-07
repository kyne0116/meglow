import { Controller, Get, Param, Post, Body, UseGuards } from "@nestjs/common";
import { LearningSessionStatus, LearningType } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { StartScenarioSessionDto } from "./dto/start-scenario-session.dto";
import { SubmitScenarioInputDto } from "./dto/submit-scenario-input.dto";
import { ScenarioSessionService } from "./scenario-session.service";

@UseGuards(JwtAuthGuard)
@Controller("english/reading")
export class ReadingController {
  constructor(private readonly scenarioService: ScenarioSessionService) {}

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
    return this.scenarioService.start(user, LearningType.READING, dto);
  }

  @Post("session/:sessionId/submit")
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param("sessionId") sessionId: string,
    @Body() dto: SubmitScenarioInputDto
  ): Promise<{
    sessionId: string;
    inputs: number;
    score: number;
    feedback: string;
    correction: string;
    nextAction: string;
  }> {
    return this.scenarioService.submit(user, LearningType.READING, sessionId, dto);
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
    return this.scenarioService.end(user, LearningType.READING, sessionId);
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
    return this.scenarioService.progress(user, LearningType.READING, childId);
  }
}
