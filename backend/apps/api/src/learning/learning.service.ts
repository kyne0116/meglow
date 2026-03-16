import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChildWordProgress,
  K12Stage,
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

type LearningSummaryWord = {
  word: string;
  meaningZh: string;
  phonetic: string | null;
};

type LearningReviewWord = LearningSummaryWord & {
  incorrectItems: Array<
    'WORD_MEANING' | 'WORD_SPELLING' | 'WORD_PRONUNCIATION' | 'CONTENT_REVIEW'
  >;
};

type LearningSessionSummary = {
  totalItems: number;
  correctItems: number;
  accuracy: number;
  newWordsLearned: number;
  reviewWordsCompleted: number;
  masteredWords: LearningSummaryWord[];
  needsReviewWords: LearningReviewWord[];
};

type SessionItemRecord = {
  id: string;
  itemType:
    | 'WORD_MEANING'
    | 'WORD_SPELLING'
    | 'WORD_PRONUNCIATION'
    | 'CONTENT_REVIEW';
  sequence: number;
  prompt: Record<string, unknown>;
  result?: Record<string, unknown> | null;
};

export interface LearningSessionRecord {
  id: string;
  taskId: string;
  childId: string;
  subject: 'ENGLISH' | 'CHINESE' | 'MATH';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  finishedAt?: string | null;
  items: SessionItemRecord[];
}

type TaskWithSessionContext = {
  id: string;
  childId: string;
  status: TaskStatus;
  contentJson: Prisma.JsonValue;
  textbookContextJson: Prisma.JsonValue | null;
  contentVersionSnapshotJson: Prisma.JsonValue | null;
  child: {
    k12Stage: K12Stage;
  };
  sessions: Array<{
    id: string;
    taskId: string;
    childId: string;
    subject: SubjectType;
    status: SessionStatus;
    startedAt: Date;
    finishedAt: Date | null;
    items: LearningSessionItem[];
  }>;
};

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
    if (this.isTextbookContentTask(taskContent)) {
      return this.createTextbookSession(task as TaskWithSessionContext);
    }

    if (!this.isEnglishWordTask(taskContent)) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'task type is not supported for learning session',
        details: {},
      });
    }

    return this.createEnglishSession(task as TaskWithSessionContext, taskContent);
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
    summary: LearningSessionSummary;
  }> {
    const session = await this.prismaService.learningSession.findFirst({
      where: {
        id: sessionId,
        child: {
          familyId: currentParent.familyId,
        },
      },
      include: {
        task: {
          select: {
            id: true,
            contentJson: true,
            textbookContextJson: true,
          },
        },
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

    const taskContent = this.asObject(session.task.contentJson);
    if (this.isTextbookContentTask(taskContent)) {
      return this.finishTextbookSession(session);
    }

    return this.finishEnglishSession(session);
  }

  private async createEnglishSession(
    task: TaskWithSessionContext,
    taskContent: Record<string, unknown>,
  ): Promise<LearningSessionRecord> {
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

        await prisma.learningSessionItem.create({
          data: {
            sessionId: session.id,
            wordId: word.id,
            itemType: LearningItemType.WORD_PRONUNCIATION,
            sequence: sequence++,
            promptJson: {
              word: word.value,
              phonetic: word.phonetic,
              exampleSentence: word.exampleSentence,
              instruction: `请先朗读单词 ${word.value}`,
              kind: word.kind,
            },
            correctAnswerJson: {
              completed: true,
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

  private async createTextbookSession(
    task: TaskWithSessionContext,
  ): Promise<LearningSessionRecord> {
    const taskContent = this.asObject(task.contentJson);
    const textbookContext = this.asObject(task.textbookContextJson);
    const snapshot = this.asObject(task.contentVersionSnapshotJson);
    const itemRefs = this.readTextbookContentReferences(taskContent, snapshot);

    if (itemRefs.length === 0) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'textbook task does not contain any content items',
        details: {},
      });
    }

    const versionIds = itemRefs
      .map((item) => item.contentVersionId)
      .filter((value): value is string => Boolean(value));

    const versions = await this.prismaService.contentItemVersion.findMany({
      where: {
        id: {
          in: versionIds,
        },
      },
      select: {
        id: true,
        version: true,
        payloadJson: true,
      },
    });
    const versionsById = new Map(versions.map((item) => [item.id, item]));

    const createdSession = await this.prismaService.$transaction(async (prisma) => {
      const session = await prisma.learningSession.create({
        data: {
          taskId: task.id,
          childId: task.childId,
          subject: this.resolveSessionSubject(taskContent),
          status: SessionStatus.IN_PROGRESS,
        },
      });

      let sequence = 1;
      for (const itemRef of itemRefs) {
        const version = itemRef.contentVersionId
          ? versionsById.get(itemRef.contentVersionId)
          : undefined;
        const sessionItemInputs = this.buildTextbookSessionItems({
          taskContent,
          textbookContext,
          itemRef,
          versionPayload: this.asObject(version?.payloadJson),
          fallbackVersion: version?.version,
        });

        for (const sessionItemInput of sessionItemInputs) {
          await prisma.learningSessionItem.create({
            data: {
              sessionId: session.id,
              itemType: LearningItemType.CONTENT_REVIEW,
              sequence: sequence++,
              promptJson: sessionItemInput.promptJson,
              correctAnswerJson: sessionItemInput.correctAnswerJson,
              contentVersionSnapshotJson:
                sessionItemInput.contentVersionSnapshotJson as Prisma.InputJsonValue,
            },
          });
        }
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

  private async finishEnglishSession(session: {
    id: string;
    taskId: string;
    childId: string;
    items: LearningSessionItem[];
  }): Promise<{
    sessionId: string;
    status: 'COMPLETED';
    summary: LearningSessionSummary;
  }> {
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
    const wordSummaries = this.buildEnglishWordSummaries(session.items);
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
            masteredWords: wordSummaries
              .filter((item) => item.incorrectItems.length === 0)
              .map(({ word, meaningZh, phonetic }) => ({
                word,
                meaningZh,
                phonetic,
              })),
            needsReviewWords: wordSummaries
              .filter((item) => item.incorrectItems.length > 0)
              .map(({ word, meaningZh, phonetic, incorrectItems }) => ({
                word,
                meaningZh,
                phonetic,
                incorrectItems,
              })),
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
        masteredWords: wordSummaries
          .filter((item) => item.incorrectItems.length === 0)
          .map(({ word, meaningZh, phonetic }) => ({
            word,
            meaningZh,
            phonetic,
          })),
        needsReviewWords: wordSummaries
          .filter((item) => item.incorrectItems.length > 0)
          .map(({ word, meaningZh, phonetic, incorrectItems }) => ({
            word,
            meaningZh,
            phonetic,
            incorrectItems,
          })),
      },
    };
  }

  private async finishTextbookSession(session: {
    id: string;
    taskId: string;
    childId: string;
    task: {
      textbookContextJson: Prisma.JsonValue | null;
    };
    items: LearningSessionItem[];
  }): Promise<{
    sessionId: string;
    status: 'COMPLETED';
    summary: LearningSessionSummary;
  }> {
    const totalItems = session.items.length;
    const correctItems = session.items.filter(
      (item) => this.asObject(item.resultJson).isCorrect === true,
    ).length;
    const accuracy = totalItems === 0 ? 0 : correctItems / totalItems;
    const now = new Date();
    const textbookContext = this.asObject(session.task.textbookContextJson);
    const bindingId = this.readString(textbookContext.bindingId);
    const nodeId = this.readString(textbookContext.nodeId);

    await this.prismaService.$transaction(async (prisma) => {
      if (bindingId) {
        const currentProgress = await prisma.childSubjectProgress.findUnique({
          where: {
            childSubjectBindingId: bindingId,
          },
          select: {
            id: true,
            completedNodeCount: true,
            lastCompletedNodeId: true,
          },
        });

        const nextCompletedNodeCount =
          currentProgress && nodeId && currentProgress.lastCompletedNodeId !== nodeId
            ? currentProgress.completedNodeCount + 1
            : currentProgress?.completedNodeCount ?? (nodeId ? 1 : 0);

        await prisma.childSubjectProgress.upsert({
          where: {
            childSubjectBindingId: bindingId,
          },
          update: {
            currentNodeId: nodeId ?? undefined,
            lastCompletedNodeId: nodeId ?? undefined,
            completedNodeCount: nextCompletedNodeCount,
            lastStudiedAt: now,
          },
          create: {
            childSubjectBindingId: bindingId,
            currentNodeId: nodeId ?? null,
            lastCompletedNodeId: nodeId ?? null,
            completedNodeCount: nodeId ? 1 : 0,
            lastStudiedAt: now,
          },
        });

        if (nodeId) {
          await prisma.childSubjectBinding.update({
            where: {
              id: bindingId,
            },
            data: {
              currentNodeId: nodeId,
            },
          });
        }
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
            newWordsLearned: 0,
            reviewWordsCompleted: 0,
            masteredWords: [],
            needsReviewWords: [],
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
        newWordsLearned: 0,
        reviewWordsCompleted: 0,
        masteredWords: [],
        needsReviewWords: [],
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
        itemType: item.itemType as
          | 'WORD_MEANING'
          | 'WORD_SPELLING'
          | 'WORD_PRONUNCIATION'
          | 'CONTENT_REVIEW',
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
        feedback: isCorrect ? 'meaning matched' : `expected answer is ${expected}`,
        guidance: isCorrect ? 'continue at the same pace' : 'focus on the core meaning first',
        encouragement: isCorrect ? 'good job' : 'try the next item carefully',
      };
    }

    if (sessionItem.itemType === LearningItemType.WORD_SPELLING) {
      const submittedText = String(answer.text ?? '').trim().toLowerCase();
      const expectedText = String(correctAnswer.text ?? '').trim().toLowerCase();
      const isCorrect = submittedText === expectedText;
      return {
        isCorrect,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect ? 'spelling matched' : `expected spelling is ${correctAnswer.text}`,
        guidance: isCorrect ? 'keep the spelling accuracy' : 'focus on the first letters and length',
        encouragement: isCorrect ? 'keep going' : 'one more try will help',
      };
    }

    if (sessionItem.itemType === LearningItemType.WORD_PRONUNCIATION) {
      const completed = answer.completed === true;
      const selfRating = String(answer.selfRating ?? '')
        .trim()
        .toUpperCase();

      if (completed && selfRating === 'GOOD') {
        return {
          isCorrect: true,
          score: 100,
          feedback: 'pronunciation felt smooth and clear',
          guidance: 'keep the pace steady and move to the next word',
          encouragement: 'excellent speaking practice',
        };
      }

      if (completed && selfRating === 'OK') {
        return {
          isCorrect: true,
          score: 80,
          feedback: 'the pronunciation was mostly right',
          guidance: 'read it once more with a steady rhythm, then continue',
          encouragement: 'good job speaking it out loud',
        };
      }

      if (completed && selfRating === 'NEEDS_PRACTICE') {
        return {
          isCorrect: false,
          score: 60,
          feedback: 'the word still needs another careful read',
          guidance: 'slow down, follow the phonetic hint, and read it aloud again',
          encouragement: 'one more round will make it smoother',
        };
      }

      return {
        isCorrect: completed,
        score: completed ? 100 : 0,
        feedback: completed ? 'pronunciation practice completed' : 'please read the word aloud first',
        guidance: completed
          ? 'continue to the next word after reading clearly'
          : 'read the word aloud once and then submit',
        encouragement: completed ? 'good speaking practice' : 'try speaking the word once',
      };
    }

    if (sessionItem.itemType === LearningItemType.CONTENT_REVIEW) {
      const prompt = this.asObject(sessionItem.promptJson);
      const answerMode = String(prompt.answerMode ?? 'completion');

      if (answerMode === 'multiple_choice') {
        const selected = String(answer.selected ?? '').trim();
        const expected = String(correctAnswer.selected ?? '').trim();
        const isCorrect = selected === expected;
        return {
          isCorrect,
          score: isCorrect ? 100 : 0,
          feedback: isCorrect ? 'choice matched' : `expected answer is ${expected}`,
          guidance: isCorrect ? 'continue to the next item' : 'review the key clue and choose again next time',
          encouragement: isCorrect ? 'nice work' : 'keep reviewing',
        };
      }

      if (answerMode === 'short_answer') {
        const text = String(answer.text ?? '').trim();
        const isCorrect = text.length > 0;
        return {
          isCorrect,
          score: isCorrect ? 80 : 0,
          feedback: isCorrect ? 'answer submitted' : 'please provide a short answer',
          guidance: isCorrect
            ? 'compare the child answer with teacher review later'
            : 'summarize the key idea in one sentence',
          encouragement: isCorrect ? 'response recorded' : 'try writing one sentence',
        };
      }

      const completed = answer.completed === true;
      return {
        isCorrect: completed,
        score: completed ? 100 : 0,
        feedback: completed ? 'content review completed' : 'mark the content as completed after review',
        guidance: completed
          ? 'continue to the next textbook item'
          : 'finish reviewing the content before submitting',
        encouragement: completed ? 'progress recorded' : 'keep reviewing',
      };
    }

    return {
      isCorrect: false,
      score: 0,
      feedback: 'unsupported item type',
      guidance: 'skip this session and contact support',
      encouragement: 'try again later',
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

  private buildEnglishWordSummaries(items: LearningSessionItem[]): Array<{
    word: string;
    meaningZh: string;
    phonetic: string | null;
    incorrectItems: Array<'WORD_MEANING' | 'WORD_SPELLING' | 'WORD_PRONUNCIATION'>;
  }> {
    const wordIds = Array.from(
      new Set(items.map((item) => item.wordId).filter((wordId): wordId is string => Boolean(wordId))),
    );

    return wordIds.map((wordId) => {
      const wordItems = items.filter((item) => item.wordId === wordId);
      const prompts = wordItems.map((item) => this.asObject(item.promptJson));
      const correctAnswers = wordItems.map((item) => this.asObject(item.correctAnswerJson));
      const word =
        prompts
          .map((prompt) => this.readString(prompt.word))
          .find((value): value is string => Boolean(value)) ?? wordId;
      const meaningZh =
        prompts
          .map((prompt) => this.readString(prompt.meaningZh))
          .find((value): value is string => Boolean(value)) ??
        correctAnswers
          .map((answer) => this.readString(answer.selected))
          .find((value): value is string => Boolean(value)) ??
        '';
      const phonetic =
        prompts
          .map((prompt) => this.readString(prompt.phonetic))
          .find((value): value is string => Boolean(value)) ?? null;
      const incorrectItems = wordItems
        .filter((item) => this.asObject(item.resultJson).isCorrect !== true)
        .map((item) => item.itemType)
        .filter(
          (
            item,
          ): item is 'WORD_MEANING' | 'WORD_SPELLING' | 'WORD_PRONUNCIATION' =>
            item === LearningItemType.WORD_MEANING ||
            item === LearningItemType.WORD_SPELLING ||
            item === LearningItemType.WORD_PRONUNCIATION,
        );

      return {
        word,
        meaningZh,
        phonetic,
        incorrectItems,
      };
    });
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

  private readTextbookContentReferences(
    taskContent: Record<string, unknown>,
    snapshot: Record<string, unknown>,
  ): Array<{
    contentItemId?: string;
    contentVersionId?: string;
    title?: string;
    itemType?: string;
    version?: number;
  }> {
    const itemsSource = Array.isArray(snapshot.items)
      ? snapshot.items
      : Array.isArray(taskContent.contentItems)
        ? taskContent.contentItems
        : [];

    return itemsSource
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item),
      )
      .map((item) => ({
        contentItemId: this.readString(item.contentItemId),
        contentVersionId: this.readString(item.contentVersionId),
        title: this.readString(item.title),
        itemType: this.readString(item.itemType),
        version: typeof item.version === 'number' ? item.version : undefined,
      }))
      .filter((item) => Boolean(item.contentItemId));
  }

  private buildTextbookSessionItems(input: {
    taskContent: Record<string, unknown>;
    textbookContext: Record<string, unknown>;
    itemRef: {
      contentItemId?: string;
      contentVersionId?: string;
      title?: string;
      itemType?: string;
      version?: number;
    };
    versionPayload: Record<string, unknown>;
    fallbackVersion?: number;
  }): Array<{
    promptJson: Prisma.InputJsonValue;
    correctAnswerJson: Prisma.InputJsonValue;
    contentVersionSnapshotJson: Record<string, unknown>;
  }> {
    const commonPrompt = {
      mode: 'textbook_content_review',
      subjectCode: input.textbookContext.subjectCode ?? input.taskContent.subjectCode ?? null,
      subjectName: input.textbookContext.subjectName ?? input.taskContent.subjectName ?? null,
      nodeId: input.textbookContext.nodeId ?? input.taskContent.nodeId ?? null,
      nodeTitle: input.textbookContext.nodeTitle ?? input.taskContent.nodeTitle ?? null,
      contentItemId: input.itemRef.contentItemId,
      contentVersionId: input.itemRef.contentVersionId,
      title: input.itemRef.title,
      itemType: input.itemRef.itemType,
      version: input.itemRef.version ?? input.fallbackVersion ?? null,
    };

    const commonSnapshot = {
      contentItemId: input.itemRef.contentItemId,
      contentVersionId: input.itemRef.contentVersionId,
      title: input.itemRef.title,
      itemType: input.itemRef.itemType,
      version: input.itemRef.version ?? input.fallbackVersion ?? null,
    };

    if (input.itemRef.itemType === 'TEXT') {
      const blocks = this.asArrayOfObjects(input.versionPayload.blocks);
      const paragraphCount = blocks.length;
      const paragraphCountOptions = this.buildNumberOptions(paragraphCount);
      const builtItems: Array<{
        promptJson: Prisma.InputJsonValue;
        correctAnswerJson: Prisma.InputJsonValue;
        contentVersionSnapshotJson: Record<string, unknown>;
      }> = [];

      if (paragraphCount > 0) {
        builtItems.push({
          promptJson: {
            ...commonPrompt,
            answerMode: 'multiple_choice',
            questionType: 'paragraph_count',
            prompt: `《${input.itemRef.title ?? '课文'}》一共有几段内容？`,
            options: paragraphCountOptions,
          } as Prisma.InputJsonValue,
          correctAnswerJson: {
            selected: String(paragraphCount),
          } as Prisma.InputJsonValue,
          contentVersionSnapshotJson: {
            ...commonSnapshot,
            questionType: 'paragraph_count',
          },
        });
      }

      builtItems.push({
        promptJson: {
          ...commonPrompt,
          answerMode: 'completion',
          questionType: 'reading_completion',
          prompt: `朗读并完成《${input.itemRef.title ?? '课文'}》学习`,
          payload: input.versionPayload,
        } as Prisma.InputJsonValue,
        correctAnswerJson: {
          completed: true,
        } as Prisma.InputJsonValue,
        contentVersionSnapshotJson: {
          ...commonSnapshot,
          questionType: 'reading_completion',
        },
      });

      return builtItems;
    }

    if (input.itemRef.itemType === 'CHARACTER') {
      const characters = this.asArrayOfObjects(input.versionPayload.characters).slice(0, 3);
      const builtItems: Array<{
        promptJson: Prisma.InputJsonValue;
        correctAnswerJson: Prisma.InputJsonValue;
        contentVersionSnapshotJson: Record<string, unknown>;
      }> = [];
      const fallbackRadicals = ['日', '讠', '穴', '木', '口', '氵'];
      const fallbackStructures = ['左右', '上下', '独体', '半包围'];

      for (const [index, character] of characters.entries()) {
        const value = this.readString(character.value);
        const radical = this.readString(character.radical);
        const structure = this.readString(character.structure);
        if (!value) {
          continue;
        }

        if (radical) {
          builtItems.push({
            promptJson: {
              ...commonPrompt,
              answerMode: 'multiple_choice',
              questionType: 'character_radical',
              prompt: `“${value}”的偏旁是什么？`,
              options: this.buildChoiceOptions(
                radical,
                characters
                  .map((item) => this.readString(item.radical))
                  .filter((item): item is string => Boolean(item)),
                fallbackRadicals,
              ),
              character: value,
            } as Prisma.InputJsonValue,
            correctAnswerJson: {
              selected: radical,
            } as Prisma.InputJsonValue,
            contentVersionSnapshotJson: {
              ...commonSnapshot,
              questionType: 'character_radical',
              character: value,
              questionIndex: index + 1,
            },
          });
        }

        if (structure) {
          builtItems.push({
            promptJson: {
              ...commonPrompt,
              answerMode: 'multiple_choice',
              questionType: 'character_structure',
              prompt: `“${value}”是什么结构？`,
              options: this.buildChoiceOptions(
                structure,
                characters
                  .map((item) => this.readString(item.structure))
                  .filter((item): item is string => Boolean(item)),
                fallbackStructures,
              ),
              character: value,
            } as Prisma.InputJsonValue,
            correctAnswerJson: {
              selected: structure,
            } as Prisma.InputJsonValue,
            contentVersionSnapshotJson: {
              ...commonSnapshot,
              questionType: 'character_structure',
              character: value,
              questionIndex: index + 1,
            },
          });
        }
      }

      if (builtItems.length > 0) {
        return builtItems;
      }
    }

    if (input.itemRef.itemType === 'EXERCISE') {
      const questions = this.asArrayOfObjects(input.versionPayload.questions);
      const tasks = this.asArrayOfObjects(input.versionPayload.tasks);
      const builtItems: Array<{
        promptJson: Prisma.InputJsonValue;
        correctAnswerJson: Prisma.InputJsonValue;
        contentVersionSnapshotJson: Record<string, unknown>;
      }> = [];

      for (const [index, question] of questions.entries()) {
        const questionType = this.readString(question.type) ?? 'short_answer';
        if (questionType === 'multiple_choice') {
          builtItems.push({
            promptJson: {
              ...commonPrompt,
              answerMode: 'multiple_choice',
              questionType,
              prompt: this.readString(question.prompt) ?? input.itemRef.title ?? 'question',
              options: Array.isArray(question.options) ? question.options : [],
              questionIndex: index + 1,
            } as Prisma.InputJsonValue,
            correctAnswerJson: {
              selected: this.readString(question.answer) ?? '',
            } as Prisma.InputJsonValue,
            contentVersionSnapshotJson: {
              ...commonSnapshot,
              questionType,
              questionIndex: index + 1,
            },
          });
          continue;
        }

        builtItems.push({
          promptJson: {
            ...commonPrompt,
            answerMode: 'short_answer',
            questionType,
            prompt: this.readString(question.prompt) ?? input.itemRef.title ?? 'question',
            questionIndex: index + 1,
          } as Prisma.InputJsonValue,
          correctAnswerJson: {
            requiresText: true,
          } as Prisma.InputJsonValue,
          contentVersionSnapshotJson: {
            ...commonSnapshot,
            questionType,
            questionIndex: index + 1,
          },
        });
      }

      for (const [index, task] of tasks.entries()) {
        const taskType = this.readString(task.type) ?? 'task';
        builtItems.push({
          promptJson: {
            ...commonPrompt,
            answerMode: 'completion',
            questionType: taskType,
            prompt: this.readString(task.prompt) ?? input.itemRef.title ?? 'task',
            taskIndex: index + 1,
          } as Prisma.InputJsonValue,
          correctAnswerJson: {
            completed: true,
          } as Prisma.InputJsonValue,
          contentVersionSnapshotJson: {
            ...commonSnapshot,
            questionType: taskType,
            taskIndex: index + 1,
          },
        });
      }

      if (builtItems.length > 0) {
        return builtItems;
      }
    }

    return [
      {
        promptJson: {
          ...commonPrompt,
          answerMode: 'completion',
          payload: input.versionPayload,
        } as Prisma.InputJsonValue,
        correctAnswerJson: {
          completed: true,
        } as Prisma.InputJsonValue,
        contentVersionSnapshotJson: commonSnapshot,
      },
    ];
  }

  private resolveSessionSubject(taskContent: Record<string, unknown>): SubjectType {
    const subjectCode = String(taskContent.subjectCode ?? '').toUpperCase();
    if (subjectCode === SubjectType.CHINESE) {
      return SubjectType.CHINESE;
    }
    if (subjectCode === SubjectType.MATH) {
      return SubjectType.MATH;
    }
    return SubjectType.ENGLISH;
  }

  private isEnglishWordTask(taskContent: Record<string, unknown>): boolean {
    const mode = String(taskContent.mode ?? '');
    return mode === 'word_learning' || mode === 'word_review';
  }

  private isTextbookContentTask(taskContent: Record<string, unknown>): boolean {
    return String(taskContent.mode ?? '') === 'textbook_content_review';
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private asArrayOfObjects(value: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && !Array.isArray(item),
    );
  }

  private buildChoiceOptions(
    correct: string,
    currentPool: string[],
    fallbackPool: string[],
  ): string[] {
    const pool = [correct, ...currentPool, ...fallbackPool]
      .filter((item, index, array) => item.trim().length > 0 && array.indexOf(item) === index)
      .slice(0, 6);

    const distractors = pool.filter((item) => item !== correct).slice(0, 3);
    return [correct, ...distractors];
  }

  private buildNumberOptions(answer: number): string[] {
    const candidates = [answer, Math.max(1, answer - 1), answer + 1, answer + 2];
    return candidates
      .filter((item, index, array) => array.indexOf(item) === index)
      .map((item) => String(item));
  }

  private asObject(value: unknown): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, any>;
  }
}
