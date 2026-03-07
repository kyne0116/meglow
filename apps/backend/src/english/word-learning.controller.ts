import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { EbReviewStage, LearningSessionStatus } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { StartWordSessionDto } from "./dto/start-word-session.dto";
import { SubmitWordAnswerDto } from "./dto/submit-word-answer.dto";
import { WordLearningService } from "./word-learning.service";

@UseGuards(JwtAuthGuard)
@Controller("english/word-learning")
export class WordLearningController {
  constructor(private readonly wordLearningService: WordLearningService) {}

  @Post("session/start")
  async startSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartWordSessionDto
  ): Promise<{ sessionId: string; status: LearningSessionStatus; startedAt: Date }> {
    return this.wordLearningService.startSession(user, dto);
  }

  @Post("session/:sessionId/answer")
  async submitAnswer(
    @CurrentUser() user: JwtPayload,
    @Param("sessionId") sessionId: string,
    @Body() dto: SubmitWordAnswerDto
  ): Promise<{
    sessionId: string;
    answers: number;
    latestCorrect: boolean;
    wordStage: EbReviewStage;
    nextReviewAt: Date | null;
  }> {
    return this.wordLearningService.submitAnswer(user, sessionId, dto);
  }

  @Post("session/:sessionId/end")
  async endSession(
    @CurrentUser() user: JwtPayload,
    @Param("sessionId") sessionId: string
  ): Promise<{
    sessionId: string;
    status: LearningSessionStatus;
    accuracy: number;
    durationSec: number;
    briefingId: string;
    points: number;
    totalPoints: number;
    level: number;
    streakDays: number;
  }> {
    return this.wordLearningService.endSession(user, sessionId);
  }

  @Get("progress/:childId")
  async getProgress(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string
  ): Promise<{
    childId: string;
    totalSessions: number;
    completedSessions: number;
    averageAccuracy: number;
    totalWords: number;
    masteredWords: number;
    dueWords: number;
  }> {
    return this.wordLearningService.getProgress(user, childId);
  }
}
