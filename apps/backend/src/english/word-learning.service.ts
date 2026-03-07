import { EbReviewStage, LearningSessionStatus, LearningType } from "@prisma/client";
import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { BriefingService } from "../briefing/briefing.service";
import { GamificationService } from "../gamification/gamification.service";
import { PrismaService } from "../prisma/prisma.service";
import { StartWordSessionDto } from "./dto/start-word-session.dto";
import { SubmitWordAnswerDto } from "./dto/submit-word-answer.dto";

@Injectable()
export class WordLearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly briefingService: BriefingService,
    private readonly gamificationService: GamificationService
  ) {}

  async startSession(
    user: JwtPayload,
    dto: StartWordSessionDto
  ): Promise<{ sessionId: string; status: LearningSessionStatus; startedAt: Date }> {
    const child = await this.prisma.child.findFirst({
      where: {
        id: dto.childId,
        familyId: user.familyId
      }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const session = await this.prisma.learningSession.create({
      data: {
        childId: dto.childId,
        type: LearningType.WORD_LEARNING,
        payload: {
          words: dto.words ?? [],
          source: "manual_start"
        },
        answerLogs: []
      }
    });

    return { sessionId: session.id, status: session.status, startedAt: session.startedAt };
  }

  async submitAnswer(
    user: JwtPayload,
    sessionId: string,
    dto: SubmitWordAnswerDto
  ): Promise<{
    sessionId: string;
    answers: number;
    latestCorrect: boolean;
    wordStage: EbReviewStage;
    nextReviewAt: Date | null;
  }> {
    const session = await this.prisma.learningSession.findFirst({
      where: {
        id: sessionId,
        type: LearningType.WORD_LEARNING,
        status: LearningSessionStatus.IN_PROGRESS,
        child: { familyId: user.familyId }
      }
    });
    if (!session) {
      throw new NotFoundException("word learning session not found");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const word = await tx.word.upsert({
        where: { value: dto.word.toLowerCase() },
        update: {},
        create: {
          value: dto.word.toLowerCase(),
          difficulty: 1
        }
      });

      const existingProgress = await tx.wordProgress.findUnique({
        where: {
          childId_wordId: {
            childId: session.childId,
            wordId: word.id
          }
        }
      });

      const currentStage = existingProgress?.stage ?? EbReviewStage.NEW;
      const nextStage = this.nextStage(currentStage, dto.correct);
      const nextReviewAt = this.nextReviewAt(nextStage);

      await tx.wordProgress.upsert({
        where: {
          childId_wordId: {
            childId: session.childId,
            wordId: word.id
          }
        },
        update: {
          stage: nextStage,
          nextReviewAt,
          reviewCount: { increment: 1 },
          correctCount: dto.correct ? { increment: 1 } : undefined,
          incorrectCount: dto.correct ? undefined : { increment: 1 },
          mastered: nextStage === EbReviewStage.MASTERED
        },
        create: {
          childId: session.childId,
          wordId: word.id,
          stage: nextStage,
          nextReviewAt,
          reviewCount: 1,
          correctCount: dto.correct ? 1 : 0,
          incorrectCount: dto.correct ? 0 : 1,
          mastered: nextStage === EbReviewStage.MASTERED
        }
      });

      const logs = Array.isArray(session.answerLogs) ? [...(session.answerLogs as object[])] : [];
      logs.push({
        word: dto.word,
        answer: dto.answer,
        correct: dto.correct,
        feedback: dto.feedback ?? "",
        stage: nextStage,
        nextReviewAt: nextReviewAt?.toISOString() ?? null
      });

      const updatedSession = await tx.learningSession.update({
        where: { id: session.id },
        data: { answerLogs: logs }
      });

      return {
        answers: logs.length,
        latestCorrect: dto.correct,
        wordStage: nextStage,
        nextReviewAt,
        updatedSession
      };
    });

    return {
      sessionId: session.id,
      answers: result.answers,
      latestCorrect: result.latestCorrect,
      wordStage: result.wordStage,
      nextReviewAt: result.nextReviewAt
    };
  }

  async endSession(
    user: JwtPayload,
    sessionId: string
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
    const session = await this.prisma.learningSession.findFirst({
      where: {
        id: sessionId,
        type: LearningType.WORD_LEARNING,
        status: LearningSessionStatus.IN_PROGRESS,
        child: { familyId: user.familyId }
      }
    });
    if (!session) {
      throw new NotFoundException("word learning session not found");
    }

    const logs = Array.isArray(session.answerLogs)
      ? (session.answerLogs as Array<{ correct?: boolean }>)
      : [];
    const total = logs.length;
    const correct = logs.filter((item) => item.correct === true).length;
    const accuracy = total === 0 ? 0 : Number(((correct / total) * 100).toFixed(2));
    const completedAt = new Date();
    const durationSec = Math.max(
      1,
      Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
    );

    const updated = await this.prisma.learningSession.update({
      where: { id: session.id },
      data: {
        status: LearningSessionStatus.COMPLETED,
        completedAt,
        accuracy,
        durationSec
      }
    });

    const briefing = await this.briefingService.generateForSession(updated.id);
    const game = await this.gamificationService.rewardWordSession(updated.childId, accuracy);

    return {
      sessionId: updated.id,
      status: updated.status,
      accuracy: updated.accuracy ?? 0,
      durationSec: updated.durationSec ?? 0,
      briefingId: briefing.briefingId,
      points: game.points,
      totalPoints: game.totalPoints,
      level: game.level,
      streakDays: game.streakDays
    };
  }

  async getProgress(
    user: JwtPayload,
    childId: string
  ): Promise<{
    childId: string;
    totalSessions: number;
    completedSessions: number;
    averageAccuracy: number;
    totalWords: number;
    masteredWords: number;
    dueWords: number;
  }> {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const sessions = await this.prisma.learningSession.findMany({
      where: {
        childId,
        type: LearningType.WORD_LEARNING
      }
    });

    const totalSessions = sessions.length;
    const completed = sessions.filter((item) => item.status === LearningSessionStatus.COMPLETED);
    const completedSessions = completed.length;
    const averageAccuracy =
      completedSessions === 0
        ? 0
        : Number(
            (
              completed.reduce((sum, item) => sum + (item.accuracy ?? 0), 0) / completedSessions
            ).toFixed(2)
          );

    const progresses = await this.prisma.wordProgress.findMany({
      where: { childId }
    });
    const now = new Date();
    const totalWords = progresses.length;
    const masteredWords = progresses.filter((item) => item.mastered).length;
    const dueWords = progresses.filter(
      (item) => item.nextReviewAt && item.nextReviewAt <= now
    ).length;

    return {
      childId,
      totalSessions,
      completedSessions,
      averageAccuracy,
      totalWords,
      masteredWords,
      dueWords
    };
  }

  private nextStage(current: EbReviewStage, correct: boolean): EbReviewStage {
    const order: EbReviewStage[] = [
      EbReviewStage.NEW,
      EbReviewStage.REVIEW_5MIN,
      EbReviewStage.REVIEW_30MIN,
      EbReviewStage.REVIEW_12H,
      EbReviewStage.REVIEW_1D,
      EbReviewStage.REVIEW_2D,
      EbReviewStage.REVIEW_4D,
      EbReviewStage.REVIEW_7D,
      EbReviewStage.REVIEW_15D,
      EbReviewStage.MASTERED
    ];

    const index = order.indexOf(current);
    if (index < 0) {
      return EbReviewStage.NEW;
    }

    if (correct) {
      return order[Math.min(index + 1, order.length - 1)];
    }

    if (index <= 1) {
      return EbReviewStage.NEW;
    }

    return order[Math.max(0, index - 2)];
  }

  private nextReviewAt(stage: EbReviewStage): Date | null {
    const now = new Date();
    if (stage === EbReviewStage.MASTERED) {
      return null;
    }

    const minutesByStage: Record<EbReviewStage, number> = {
      [EbReviewStage.NEW]: 5,
      [EbReviewStage.REVIEW_5MIN]: 5,
      [EbReviewStage.REVIEW_30MIN]: 30,
      [EbReviewStage.REVIEW_12H]: 12 * 60,
      [EbReviewStage.REVIEW_1D]: 24 * 60,
      [EbReviewStage.REVIEW_2D]: 2 * 24 * 60,
      [EbReviewStage.REVIEW_4D]: 4 * 24 * 60,
      [EbReviewStage.REVIEW_7D]: 7 * 24 * 60,
      [EbReviewStage.REVIEW_15D]: 15 * 24 * 60,
      [EbReviewStage.MASTERED]: 0
    };

    return new Date(now.getTime() + minutesByStage[stage] * 60 * 1000);
  }
}
