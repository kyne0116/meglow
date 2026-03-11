import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChildWordProgress,
  LearningItemType,
  LearningSessionItem,
  Prisma,
  SessionStatus,
  SubjectType,
  TaskStatus,
} from '@prisma/client';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { CreateLearningSessionDto } from './dto/create-learning-session.dto';
import { SubmitLearningAnswerDto } from './dto/submit-learning-answer.dto';

type SessionProgress = {
  current: number;
  total: number;
};

type SessionItemRecord = {
  id: string;
  itemType: 'WORD_MEANING' | 'WORD_SPELLING';
  sequence: number;
  prompt: Record<string, unknown>;
  result?: Record<string, unknown> | null;
};

export interface LearningSessionRecord {
  id: string;
  taskId: string;
  childId: string;
  subject: 'ENGLISH';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  finishedAt?: string | null;
  items: SessionItemRecord[];
}

@Injectable()
export class LearningService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly contentService: ContentService,
  ) {}

  async createSession(
    currentParent: CurrentParent,
    payload: CreateLearningSessionDto,
  ): Promise<LearningSessionRecord> {
    const task = await this.prismaService.learningTask.findFirst({
      where: {
        id: payload.taskId,
        child: {
          familyId: currentParent.familyId,
        },
      },
      include: {
        child: {
          select: {
            k12Stage: true,
          },
        },
        sessions: {
          where: {
            status: SessionStatus.IN_PROGRESS,
          },
          include: {
            items: {
              orderBy: {
                sequence: 'asc',
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'task not found',
        details: {},
      });
    }

    if (task.status !== TaskStatus.DELIVERED) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'task cannot create session from current status',
        details: {},
      });
    }

    if (task.sessions[0]) {
      return this.toSessionRecord(task.sessions[0], true);
    }

    const taskContent = this.asObject(task.contentJson);
    const words = await this.contentService.resolveTaskWords(
      task.childId,
      this.readWordReferences(taskContent),
      this.readWordCount(taskContent),
    );

    const createdSession = await this.prismaService.$transaction(async (prisma) => {
      const session = await prisma.learningSession.create({
        data: {
          taskId: task.id,
          childId: task.childId,
          subject: SubjectType.ENGLISH,
          status: SessionStatus.IN_PROGRESS,
        },
      });

      let sequence = 1;
      for (const word of words) {
        const options = await this.contentService.getMeaningOptions(
          word.id,
          task.child.k12Stage,
        );

        await prisma.learningSessionItem.create({
          data: {
            sessionId: session.id,
            wordId: word.id,
            itemType: LearningItemType.WORD_MEANING,
            sequence: sequence++,
            promptJson: {
              word: word.value,
              phonetic: word.phonetic,
              options,
              kind: word.kind,
            },
            correctAnswerJson: {
              selected: word.meaningZh,
            },
          },
        });

        await prisma.learningSessionItem.create({
          data: {
            sessionId: session.id,
            wordId: word.id,
            itemType: LearningItemType.WORD_SPELLING,
            sequence: sequence++,
            promptJson: {
              meaningZh: word.meaningZh,
              phonetic: word.phonetic,
              hint: `${word.value.slice(0, 1)}***`,
              wordLength: word.value.length,
              kind: word.kind,
            },
            correctAnswerJson: {
              text: word.value,
            },
          },
        });
      }

      return prisma.learningSession.findUniqueOrThrow({
        where: {
          id: session.id,
        },
        include: {
          items: {
            orderBy: {
              sequence: 'asc',
            },
          },
        },
      });
    });

    return this.toSessionRecord(createdSession, false);
  }

  async getSession(
    currentParent: CurrentParent,
    sessionId: string,
  ): Promise<LearningSessionRecord> {
    const session = await this.prismaService.learningSession.findFirst({
      where: {
        id: sessionId,
        child: {
          familyId: currentParent.familyId,
        },
      },
      include: {
        items: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'session not found',
        details: {},
      });
    }

    return this.toSessionRecord(session, true);
  }

  async submitAnswer(
    currentParent: CurrentParent,
    sessionId: string,
    payload: SubmitLearningAnswerDto,
  ): Promise<{
    sessionItemId: string;
    isCorrect: boolean;
    score: number;
    feedback: string;
    guidance: string;
    encouragement: string;
    progress: SessionProgress;
  }> {
    const session = await this.prismaService.learningSession.findFirst({
      where: {
        id: sessionId,
        child: {
          familyId: currentParent.familyId,
        },
      },
      include: {
        items: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'session not found',
        details: {},
      });
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'session cannot accept answers from current status',
        details: {},
      });
    }

    const sessionItem = session.items.find((item) => item.id === payload.sessionItemId);
    if (!sessionItem) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'session item not found',
        details: {},
      });
    }

    if (sessionItem.childAnswerJson) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'session item already answered',
        details: {},
      });
    }

    const evaluation = this.evaluateAnswer(sessionItem, payload.answer);
    await this.prismaService.learningSessionItem.update({
      where: {
        id: sessionItem.id,
      },
      data: {
        childAnswerJson: payload.answer as Prisma.InputJsonValue,
        resultJson: {
          isCorrect: evaluation.isCorrect,
          score: evaluation.score,
          feedback: evaluation.feedback,
          guidance: evaluation.guidance,
          encouragement: evaluation.encouragement,
        } as Prisma.InputJsonValue,
      },
    });

    const answeredCount = session.items.filter((item) => item.childAnswerJson).length + 1;

    return {
      sessionItemId: sessionItem.id,
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      feedback: evaluation.feedback,
      guidance: evaluation.guidance,
      encouragement: evaluation.encouragement,
      progress: {
        current: answeredCount,
        total: session.items.length,
      },
    };
  }

  async finishSession(
    currentParent: CurrentParent,
    sessionId: string,
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
    const session = await this.prismaService.learningSession.findFirst({
      where: {
        id: sessionId,
        child: {
          familyId: currentParent.familyId,
        },
      },
      include: {
        items: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'session not found',
        details: {},
      });
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'session cannot finish from current status',
        details: {},
      });
    }

    if (session.items.some((item) => !item.childAnswerJson)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'all session items must be answered before finish',
        details: {},
      });
    }

    const wordIds = Array.from(
      new Set(
        session.items
          .map((item) => item.wordId)
          .filter((wordId): wordId is string => Boolean(wordId)),
      ),
    );
    const existingProgresses = await this.prismaService.childWordProgress.findMany({
      where: {
        childId: session.childId,
        wordId: {
          in: wordIds,
        },
      },
    });
    const existingProgressByWordId = new Map(
      existingProgresses.map((progress) => [progress.wordId, progress]),
    );

    const totalItems = session.items.length;
    const correctItems = session.items.filter(
      (item) => this.asObject(item.resultJson).isCorrect === true,
    ).length;
    const accuracy = totalItems === 0 ? 0 : correctItems / totalItems;
    const newWordsLearned = wordIds.filter((wordId) => !existingProgressByWordId.has(wordId))
      .length;
    const reviewWordsCompleted = wordIds.filter((wordId) =>
      existingProgressByWordId.has(wordId),
    ).length;
    const now = new Date();

    await this.prismaService.$transaction(async (prisma) => {
      for (const wordId of wordIds) {
        const wordItems = session.items.filter((item) => item.wordId === wordId);
        const correctCount = wordItems.filter(
          (item) => this.asObject(item.resultJson).isCorrect === true,
        ).length;
        const progress = existingProgressByWordId.get(wordId);

        if (!progress) {
          const reviewStage = correctCount === wordItems.length ? 1 : 0;
          await prisma.childWordProgress.create({
            data: {
              childId: session.childId,
              wordId,
              masteryLevel: reviewStage,
              correctStreak: reviewStage,
              reviewStage,
              lastReviewedAt: now,
              nextReviewAt: this.computeNextReviewAt(now, reviewStage),
              totalAttempts: wordItems.length,
              correctAttempts: correctCount,
            },
          });
          continue;
        }

        await prisma.childWordProgress.update({
          where: {
            id: progress.id,
          },
          data: this.buildProgressUpdate(progress, wordItems.length, correctCount, now),
        });
      }

      await prisma.learningSession.update({
        where: {
          id: session.id,
        },
        data: {
          status: SessionStatus.COMPLETED,
          finishedAt: now,
          summaryJson: {
            totalItems,
            correctItems,
            accuracy,
            newWordsLearned,
            reviewWordsCompleted,
          },
        },
      });

      await prisma.learningTask.update({
        where: {
          id: session.taskId,
        },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: now,
        },
      });
    });

    return {
      sessionId: session.id,
      status: 'COMPLETED',
      summary: {
        totalItems,
        correctItems,
        accuracy,
        newWordsLearned,
        reviewWordsCompleted,
      },
    };
  }

  private toSessionRecord(
    session: {
      id: string;
      taskId: string;
      childId: string;
      subject: SubjectType;
      status: SessionStatus;
      startedAt: Date;
      finishedAt: Date | null;
      items: LearningSessionItem[];
    },
    includeResults: boolean,
  ): LearningSessionRecord {
    return {
      id: session.id,
      taskId: session.taskId,
      childId: session.childId,
      subject: session.subject,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt?.toISOString() ?? null,
      items: session.items.map((item) => ({
        id: item.id,
        itemType: item.itemType as 'WORD_MEANING' | 'WORD_SPELLING',
        sequence: item.sequence,
        prompt: this.asObject(item.promptJson),
        ...(includeResults
          ? {
              result: item.resultJson ? this.asObject(item.resultJson) : null,
            }
          : {}),
      })),
    };
  }

  private evaluateAnswer(
    sessionItem: LearningSessionItem,
    answer: Record<string, unknown>,
  ) {
    const correctAnswer = this.asObject(sessionItem.correctAnswerJson);

    if (sessionItem.itemType === LearningItemType.WORD_MEANING) {
      const selected = String(answer.selected ?? '').trim();
      const expected = String(correctAnswer.selected ?? '').trim();
      const isCorrect = selected === expected;
      return {
        isCorrect,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect ? '词义选择正确' : `正确答案是 ${expected}`,
        guidance: isCorrect ? '继续保持当前节奏' : '下一次先抓住核心词义再选择',
        encouragement: isCorrect ? '做得很好' : '别着急，再试下一题',
      };
    }

    const submittedText = String(answer.text ?? '').trim().toLowerCase();
    const expectedText = String(correctAnswer.text ?? '').trim().toLowerCase();
    const isCorrect = submittedText === expectedText;
    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? '拼写正确' : `标准拼写是 ${correctAnswer.text}`,
      guidance: isCorrect ? '保持拼写准确度' : '先记住首字母和单词长度',
      encouragement: isCorrect ? '继续前进' : '再练一次就会更稳',
    };
  }

  private buildProgressUpdate(
    progress: ChildWordProgress,
    attemptCount: number,
    correctCount: number,
    now: Date,
  ) {
    const allCorrect = correctCount === attemptCount;
    const reviewStage = allCorrect
      ? Math.min(progress.reviewStage + 1, 6)
      : Math.max(progress.reviewStage - 1, 0);

    return {
      masteryLevel: allCorrect
        ? Math.min(progress.masteryLevel + 1, 5)
        : Math.max(progress.masteryLevel - 1, 0),
      correctStreak: allCorrect ? progress.correctStreak + 1 : 0,
      reviewStage,
      lastReviewedAt: now,
      nextReviewAt: this.computeNextReviewAt(now, reviewStage),
      totalAttempts: progress.totalAttempts + attemptCount,
      correctAttempts: progress.correctAttempts + correctCount,
    };
  }

  private computeNextReviewAt(now: Date, reviewStage: number): Date {
    const reviewHours = [24, 48, 96, 168, 336, 720, 1440];
    const hours = reviewHours[Math.min(reviewStage, reviewHours.length - 1)];
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  private readWordCount(taskContent: Record<string, unknown>): number {
    const dueWords = Number(taskContent.dueWords ?? 0);
    const newWords = Number(taskContent.newWords ?? 0);
    const wordLength = Array.isArray(taskContent.words) ? taskContent.words.length : 0;
    return Math.max(1, wordLength || dueWords + newWords || 3);
  }

  private readWordReferences(taskContent: Record<string, unknown>) {
    if (!Array.isArray(taskContent.words)) {
      return undefined;
    }

    return taskContent.words
      .filter(
        (word): word is { id?: string; value?: string } =>
          typeof word === 'object' && word !== null,
      )
      .map((word) => ({
        id: typeof word.id === 'string' ? word.id : undefined,
        value: typeof word.value === 'string' ? word.value : undefined,
      }));
  }

  private asObject(value: unknown): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, any>;
  }
}
