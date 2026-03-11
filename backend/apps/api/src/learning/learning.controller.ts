import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentParentContext } from '../common/decorators/current-parent.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { CreateLearningSessionDto } from './dto/create-learning-session.dto';
import { SubmitLearningAnswerDto } from './dto/submit-learning-answer.dto';
import { LearningService, LearningSessionRecord } from './learning.service';

@ApiTags('learning')
@UseGuards(JwtAuthGuard)
@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('sessions')
  createSession(
    @CurrentParentContext() currentParent: CurrentParent,
    @Body() payload: CreateLearningSessionDto,
  ): Promise<LearningSessionRecord> {
    return this.learningService.createSession(currentParent, payload);
  }

  @Get('sessions/:sessionId')
  getSession(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('sessionId') sessionId: string,
  ): Promise<LearningSessionRecord> {
    return this.learningService.getSession(currentParent, sessionId);
  }

  @Post('sessions/:sessionId/answer')
  submitAnswer(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('sessionId') sessionId: string,
    @Body() payload: SubmitLearningAnswerDto,
  ): Promise<{
    sessionItemId: string;
    isCorrect: boolean;
    score: number;
    feedback: string;
    guidance: string;
    encouragement: string;
    progress: {
      current: number;
      total: number;
    };
  }> {
    return this.learningService.submitAnswer(currentParent, sessionId, payload);
  }

  @Post('sessions/:sessionId/finish')
  finishSession(
    @CurrentParentContext() currentParent: CurrentParent,
    @Param('sessionId') sessionId: string,
  ): Promise<{
    sessionId: string;
    status: 'COMPLETED';
    summary: {
      totalItems: number;
      correctItems: number;
      accuracy: number;
      newWordsLearned: number;
      reviewWordsCompleted: number;
    };
  }> {
    return this.learningService.finishSession(currentParent, sessionId);
  }
}
