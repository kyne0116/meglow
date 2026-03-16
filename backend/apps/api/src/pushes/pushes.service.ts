import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BindingStatus,
  Prisma,
  PushStatus,
  ReviewStatus,
  SessionStatus,
  SubjectCode,
  SubjectType,
  TaskStatus,
} from '@prisma/client';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { ContentService, RecommendedWord } from '../content/content.service';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { createDefaultChildLearningSettings } from '../platform-config/platform-config.constants';
import { ApprovePushDto } from './dto/approve-push.dto';

export interface PendingPushRecord {
  id: string;
  childId: string;
  childName: string;
  summary: string;
  reason: string;
  expectedOutcome: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'MODIFIED' | 'REJECTED' | 'POSTPONED';
  scheduledAt: string;
  content: Record<string, unknown>;
}

export interface TaskRecord {
  id: string;
  summary: string;
  status: 'APPROVED' | 'MODIFIED' | 'DELIVERED' | 'COMPLETED';
  scheduledAt: string;
  content: Record<string, unknown>;
}

type TextbookContentCandidate = {
  bindingId: string;
  subjectCode: string;
  subjectName: string;
  editionId: string;
  editionDisplayName: string;
  volumeId: string;
  volumeLabel: string;
  nodeId: string;
  nodeTitle: string;
  contentItems: Array<{
    contentItemId: string;
    title: string;
    itemType: string;
    contentVersionId: string;
    version: number;
    isPrimary: boolean;
  }>;
};

@Injectable()
export class PushesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly contentService: ContentService,
  ) {}

  async getPendingPushes(
    familyId: string,
    childId?: string,
  ): Promise<PendingPushRecord[]> {
    await this.ensureSeedPushes(familyId);

    if (childId) {
      await this.ensureChildBelongsToFamily(familyId, childId);
    }

    const pushes = await this.prismaService.learningPush.findMany({
      where: {
        status: PushStatus.PENDING_APPROVAL,
        child: {
          familyId,
        },
        ...(childId ? { childId } : {}),
      },
      include: {
        child: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return pushes.map((push) => ({
      id: push.id,
      childId: push.childId,
      childName: push.child.name,
      summary: push.summary,
      reason: push.reason,
      expectedOutcome: push.expectedOutcome,
      status: push.status,
      scheduledAt: push.scheduledAt.toISOString(),
      content: push.contentJson as Record<string, unknown>,
    }));
  }

  async approvePush(
    currentParent: CurrentParent,
    pushId: string,
    payload: ApprovePushDto,
  ): Promise<{ pushId: string; status: string }> {
    return this.prismaService.$transaction(async (prisma) => {
      const push = await prisma.learningPush.findFirst({
        where: {
          id: pushId,
          child: {
            familyId: currentParent.familyId,
          },
        },
      });

      if (!push) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'push not found',
          details: {},
        });
      }

      if (push.status !== PushStatus.PENDING_APPROVAL) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'push cannot be approved from current status',
          details: {},
        });
      }

      if (payload.action === 'MODIFY' && !payload.modifiedContent) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'modifiedContent is required for MODIFY',
          details: {},
        });
      }

      if (payload.action === 'POSTPONE' && !payload.postponedUntil) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'postponedUntil is required for POSTPONE',
          details: {},
        });
      }

      let nextStatus: PushStatus = push.status;
      let scheduledAt = push.scheduledAt;
      let contentJson: Prisma.InputJsonValue = push.contentJson as Prisma.InputJsonValue;

      if (payload.action === 'APPROVE') {
        nextStatus = PushStatus.APPROVED;
      } else if (payload.action === 'MODIFY') {
        nextStatus = PushStatus.MODIFIED;
        contentJson = (payload.modifiedContent ?? contentJson) as Prisma.InputJsonValue;
      } else if (payload.action === 'REJECT') {
        nextStatus = PushStatus.REJECTED;
      } else if (payload.action === 'POSTPONE') {
        nextStatus = PushStatus.POSTPONED;
        scheduledAt = new Date(payload.postponedUntil as string);
      }

      await prisma.learningPush.update({
        where: {
          id: push.id,
        },
        data: {
          status: nextStatus,
          scheduledAt,
          contentJson,
        },
      });

      const payloadJson =
        payload.action === 'MODIFY'
          ? (payload.modifiedContent as Prisma.InputJsonValue)
          : payload.action === 'POSTPONE'
            ? ({ postponedUntil: payload.postponedUntil } as Prisma.InputJsonValue)
            : undefined;

      await prisma.learningPushActionLog.create({
        data: {
          pushId: push.id,
          action: payload.action,
          operatorParentId: currentParent.parentId,
          comment: payload.comment,
          payloadJson,
        },
      });

      if (nextStatus === PushStatus.APPROVED || nextStatus === PushStatus.MODIFIED) {
        const existingTask = await prisma.learningTask.findFirst({
          where: {
            pushId: push.id,
          },
        });

        const taskData = {
          summary: push.summary,
          status:
            nextStatus === PushStatus.APPROVED
              ? TaskStatus.APPROVED
              : TaskStatus.MODIFIED,
          scheduledAt,
          contentJson,
          textbookContextJson: push.textbookContextJson as Prisma.InputJsonValue | undefined,
          contentVersionSnapshotJson:
            push.contentVersionSnapshotJson as Prisma.InputJsonValue | undefined,
        };

        if (existingTask) {
          await prisma.learningTask.update({
            where: {
              id: existingTask.id,
            },
            data: taskData,
          });
        } else {
          await prisma.learningTask.create({
            data: {
              pushId: push.id,
              childId: push.childId,
              ...taskData,
            },
          });
        }
      }

      return {
        pushId: push.id,
        status: nextStatus,
      };
    });
  }

  async getTasks(
    familyId: string,
    childId: string,
    date?: string,
  ): Promise<TaskRecord[]> {
    await this.ensureSeedPushes(familyId);
    await this.ensureChildBelongsToFamily(familyId, childId);
    const tasks = await this.prismaService.learningTask.findMany({
      where: {
        childId,
        ...(date
          ? {
              scheduledAt: {
                gte: new Date(`${date}T00:00:00.000Z`),
                lt: new Date(`${date}T23:59:59.999Z`),
              },
            }
          : {}),
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      summary: task.summary,
      status: task.status,
      scheduledAt: task.scheduledAt.toISOString(),
      content: task.contentJson as Record<string, unknown>,
    }));
  }

  async deliverPush(
    familyId: string,
    pushId: string,
  ): Promise<{ pushId: string; status: string }> {
    const task = await this.requireTaskByPushId(familyId, pushId);
    if (task.status !== TaskStatus.APPROVED && task.status !== TaskStatus.MODIFIED) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'task cannot be delivered from current status',
        details: {},
      });
    }

    const updated = await this.prismaService.learningTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: TaskStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    return {
      pushId,
      status: updated.status,
    };
  }

  async completePush(
    familyId: string,
    pushId: string,
  ): Promise<{ pushId: string; status: string }> {
    const task = await this.requireTaskByPushId(familyId, pushId);
    if (task.status !== TaskStatus.DELIVERED) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'task cannot be completed from current status',
        details: {},
      });
    }

    const updated = await this.prismaService.learningTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return {
      pushId,
      status: updated.status,
    };
  }

  private async ensureChildBelongsToFamily(
    familyId: string,
    childId: string,
  ): Promise<void> {
    const child = await this.prismaService.child.findFirst({
      where: {
        id: childId,
        familyId,
      },
      select: {
        id: true,
      },
    });

    if (!child) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'child not found',
        details: {},
      });
    }
  }

  private async requireTaskByPushId(familyId: string, pushId: string) {
    const task = await this.prismaService.learningTask.findFirst({
      where: {
        pushId,
        child: {
          familyId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'task not found for push',
        details: {},
      });
    }

    return task;
  }

  private async ensureSeedPushes(familyId: string): Promise<void> {
    const children = await this.prismaService.child.findMany({
      where: {
        familyId,
      },
      include: {
        learningSettings: {
          where: {
            subject: SubjectType.ENGLISH,
          },
        },
      },
    });

    for (const child of children) {
      const hasOpenWork = await this.hasOpenWork(child.id);
      if (hasOpenWork) {
        continue;
      }

      const textbookCandidate = await this.findTextbookContentCandidate(child.id);
      if (textbookCandidate) {
        await this.createTextbookPush(child.id, child.name, textbookCandidate);
        continue;
      }

      const settings =
        child.learningSettings[0] ??
        (await this.prismaService.childLearningSettings.create({
          data: {
            childId: child.id,
            ...createDefaultChildLearningSettings(),
          },
        }));

      await this.createEnglishPush(child.id, child.name, settings.wordsPerSession, settings.autoApprove);
    }
  }

  private async hasOpenWork(childId: string): Promise<boolean> {
    const existingOpenPushCount = await this.prismaService.learningPush.count({
      where: {
        childId,
        status: {
          in: [
            PushStatus.PENDING_APPROVAL,
            PushStatus.POSTPONED,
          ],
        },
      },
    });

    if (existingOpenPushCount > 0) {
      return true;
    }

    const existingOpenTaskCount = await this.prismaService.learningTask.count({
      where: {
        childId,
        status: {
          in: [TaskStatus.APPROVED, TaskStatus.MODIFIED, TaskStatus.DELIVERED],
        },
      },
    });

    return existingOpenTaskCount > 0;
  }

  private async createEnglishPush(
    childId: string,
    childName: string,
    wordsPerSession: number,
    autoApprove: boolean,
  ): Promise<void> {
    const reviewContext = await this.getRecentEnglishReviewContext(childId);
    const recommendedWords = await this.contentService.recommendWordsForChild(
      childId,
      wordsPerSession,
    );
    const prioritizedWords = this.prioritizeRecommendedWords(
      recommendedWords,
      reviewContext.focusReviewWords,
    );

    if (prioritizedWords.length === 0) {
      return;
    }

    const dueWords = prioritizedWords.filter((word) => word.kind === 'REVIEW').length;
    const newWords = prioritizedWords.filter((word) => word.kind === 'NEW').length;
    const status = autoApprove ? PushStatus.APPROVED : PushStatus.PENDING_APPROVAL;
    const focusReviewWords = reviewContext.focusReviewWords.map((item) => ({
      word: item.word,
      meaningZh: item.meaningZh,
      incorrectItems: item.incorrectItems,
    }));
    const reviewFocusReason =
      focusReviewWords.length > 0
        ? `Revisit ${focusReviewWords.map((item) => item.word).join(', ')} first`
        : null;
    const coachHint =
      reviewContext.primaryWeakSkill && focusReviewWords.length > 0
        ? `focus on ${reviewContext.primaryWeakSkill} for ${focusReviewWords
            .map((item) => item.word)
            .join(', ')} before unlocking new words`
        : dueWords > 0
          ? 'review due words first, then unlock new ones'
          : 'focus on meaning recognition and spelling';

    const createdPush = await this.prismaService.learningPush.create({
      data: {
        childId,
        summary: `${childName} english practice task`,
        reason:
          reviewFocusReason ??
          (dueWords > 0
            ? `Review ${dueWords} due words and add ${newWords} new words`
            : `Start ${newWords} new words for today's practice`),
        expectedOutcome:
          focusReviewWords.length > 0
            ? `Fix the recent weak spots and finish ${prioritizedWords.length} words practice`
            : `Finish ${prioritizedWords.length} words meaning and spelling practice`,
        status,
        scheduledAt: new Date(),
        contentJson: {
          mode: 'word_learning',
          dueWords,
          newWords,
          words: prioritizedWords.map((word) => ({
            id: word.id,
            value: word.value,
            meaningZh: word.meaningZh,
            phonetic: word.phonetic,
            kind: word.kind,
          })),
          coachHint,
          focusReviewWords,
          priority: dueWords > 0 ? 'high' : 'normal',
        },
        createdBy: 'rule_engine',
      },
    });

    if (autoApprove) {
      await this.prismaService.learningTask.create({
        data: {
          pushId: createdPush.id,
          childId,
          summary: createdPush.summary,
          status: TaskStatus.APPROVED,
          scheduledAt: createdPush.scheduledAt,
          contentJson: createdPush.contentJson as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async getRecentEnglishReviewContext(childId: string): Promise<{
    focusReviewWords: Array<{
      id: string;
      word: string;
      meaningZh: string;
      incorrectItems: string[];
      recommendedWord: RecommendedWord | null;
    }>;
    primaryWeakSkill: string | null;
  }> {
    const latestSession = await this.prismaService.learningSession.findFirst({
      where: {
        childId,
        subject: SubjectType.ENGLISH,
        status: SessionStatus.COMPLETED,
      },
      orderBy: [{ finishedAt: 'desc' }, { startedAt: 'desc' }],
      select: {
        summaryJson: true,
      },
    });

    const summary = this.asObject(latestSession?.summaryJson);
    const needsReviewWords = Array.isArray(summary.needsReviewWords)
      ? summary.needsReviewWords.filter(
          (item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null && !Array.isArray(item),
        )
      : [];

    if (needsReviewWords.length === 0) {
      return {
        focusReviewWords: [],
        primaryWeakSkill: null,
      };
    }

    const reviewValues = needsReviewWords
      .map((item) => this.readString(item.word))
      .filter((item): item is string => Boolean(item));
    const reviewWords = await this.prismaService.englishWord.findMany({
      where: {
        value: {
          in: reviewValues,
        },
      },
    });
    const wordsByValue = new Map(reviewWords.map((item) => [item.value, item]));
    const skillCounts = new Map<string, number>();

    const focusReviewWords = needsReviewWords
      .map((item) => {
        const wordValue = this.readString(item.word);
        if (!wordValue) {
          return null;
        }
        const matchedWord = wordsByValue.get(wordValue);
        const incorrectItems = Array.isArray(item.incorrectItems)
          ? item.incorrectItems
              .map((entry) => this.readString(entry))
              .filter((entry): entry is string => Boolean(entry))
          : [];

        for (const incorrectItem of incorrectItems) {
          skillCounts.set(incorrectItem, (skillCounts.get(incorrectItem) ?? 0) + 1);
        }

        return {
          id: matchedWord?.id ?? wordValue,
          word: wordValue,
          meaningZh: this.readString(item.meaningZh) ?? matchedWord?.meaningZh ?? '',
          incorrectItems,
          recommendedWord: matchedWord
            ? {
                id: matchedWord.id,
                value: matchedWord.value,
                phonetic: matchedWord.phonetic,
                meaningZh: matchedWord.meaningZh,
                exampleSentence: matchedWord.exampleSentence,
                imageHint: matchedWord.imageHint,
                difficultyLevel: matchedWord.difficultyLevel,
                k12Stage: matchedWord.k12Stage,
                kind: 'REVIEW',
              }
            : null,
        };
      })
      .filter(
        (
          item,
        ): item is {
          id: string;
          word: string;
          meaningZh: string;
          incorrectItems: string[];
          recommendedWord: RecommendedWord | null;
        } => Boolean(item),
      );

    const primaryWeakSkill = Array.from(skillCounts.entries()).sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })[0]?.[0];

    return {
      focusReviewWords,
      primaryWeakSkill: this.toWeakSkillLabel(primaryWeakSkill),
    };
  }

  private prioritizeRecommendedWords(
    recommendedWords: RecommendedWord[],
    focusReviewWords: Array<{
      id: string;
      word: string;
      recommendedWord: RecommendedWord | null;
    }>,
  ): RecommendedWord[] {
    if (focusReviewWords.length === 0) {
      return recommendedWords;
    }

    const selectedIds = new Set<string>();
    const prioritized: RecommendedWord[] = [];
    const wordById = new Map(recommendedWords.map((item) => [item.id, item]));
    const wordByValue = new Map(recommendedWords.map((item) => [item.value, item]));

    for (const focusWord of focusReviewWords) {
      const matched =
        wordById.get(focusWord.id) ??
        wordByValue.get(focusWord.word) ??
        focusWord.recommendedWord;
      if (!matched || selectedIds.has(matched.id)) {
        continue;
      }
      prioritized.push({ ...matched, kind: 'REVIEW' });
      selectedIds.add(matched.id);
    }

    for (const word of recommendedWords) {
      if (selectedIds.has(word.id)) {
        continue;
      }
      prioritized.push(word);
      selectedIds.add(word.id);
    }

    return prioritized.slice(0, recommendedWords.length);
  }

  private toWeakSkillLabel(itemType?: string): string | null {
    if (itemType === 'WORD_PRONUNCIATION') {
      return 'pronunciation';
    }
    if (itemType === 'WORD_SPELLING') {
      return 'spelling';
    }
    if (itemType === 'WORD_MEANING') {
      return 'meaning recognition';
    }
    return null;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private async createTextbookPush(
    childId: string,
    childName: string,
    candidate: TextbookContentCandidate,
  ): Promise<void> {
    const contentItems = candidate.contentItems.map((item) => ({
      contentItemId: item.contentItemId,
      contentVersionId: item.contentVersionId,
      title: item.title,
      itemType: item.itemType,
      version: item.version,
      isPrimary: item.isPrimary,
    }));

    const textbookContext = {
      bindingId: candidate.bindingId,
      subjectCode: candidate.subjectCode,
      subjectName: candidate.subjectName,
      editionId: candidate.editionId,
      editionDisplayName: candidate.editionDisplayName,
      volumeId: candidate.volumeId,
      volumeLabel: candidate.volumeLabel,
      nodeId: candidate.nodeId,
      nodeTitle: candidate.nodeTitle,
    };

    await this.prismaService.learningPush.create({
      data: {
        childId,
        summary: `${childName} ${candidate.subjectName} textbook task`,
        reason: `Continue ${candidate.subjectName} at ${candidate.nodeTitle}`,
        expectedOutcome: `Review ${candidate.contentItems.length} textbook content items`,
        status: PushStatus.PENDING_APPROVAL,
        scheduledAt: new Date(),
        contentJson: {
          mode: 'textbook_content_review',
          subjectCode: candidate.subjectCode,
          subjectName: candidate.subjectName,
          nodeId: candidate.nodeId,
          nodeTitle: candidate.nodeTitle,
          contentItems,
          totalContentItems: candidate.contentItems.length,
          coachHint: 'follow the current textbook node and finish the attached content items',
          priority: 'normal',
        },
        textbookContextJson: textbookContext as Prisma.InputJsonValue,
        contentVersionSnapshotJson: {
          nodeId: candidate.nodeId,
          items: contentItems,
        } as Prisma.InputJsonValue,
        createdBy: 'rule_engine',
      },
    });
  }

  private async findTextbookContentCandidate(
    childId: string,
  ): Promise<TextbookContentCandidate | null> {
    const bindings = await this.prismaService.childSubjectBinding.findMany({
      where: {
        childId,
        status: BindingStatus.ACTIVE,
        subject: {
          code: {
            not: SubjectCode.ENGLISH,
          },
        },
      },
      include: {
        subject: true,
        edition: true,
        volume: true,
        currentNode: true,
        progress: {
          include: {
            currentNode: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    for (const binding of bindings) {
      const preferredNodeId =
        binding.currentNodeId ??
        binding.progress?.currentNodeId ??
        (await this.findFirstLeafNodeId(binding.volumeId));

      if (!preferredNodeId) {
        continue;
      }

      const node = await this.prismaService.textbookNode.findUnique({
        where: {
          id: preferredNodeId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!node) {
        continue;
      }

      const links = await this.prismaService.textbookNodeContentItem.findMany({
        where: {
          textbookNodeId: node.id,
        },
        include: {
          contentItem: true,
          contentVersion: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        take: 3,
      });

      const contentItems: TextbookContentCandidate['contentItems'] = [];

      for (const link of links) {
        const effectiveVersion =
          link.contentVersion?.reviewStatus === ReviewStatus.PUBLISHED
            ? link.contentVersion
            : await this.prismaService.contentItemVersion.findFirst({
                where: {
                  contentItemId: link.contentItemId,
                  reviewStatus: ReviewStatus.PUBLISHED,
                },
                orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
              });

        if (!effectiveVersion) {
          continue;
        }

        contentItems.push({
          contentItemId: link.contentItem.id,
          title: link.contentItem.title,
          itemType: link.contentItem.itemType,
          contentVersionId: effectiveVersion.id,
          version: effectiveVersion.version,
          isPrimary: link.isPrimary,
        });
      }

      if (contentItems.length === 0) {
        continue;
      }

      return {
        bindingId: binding.id,
        subjectCode: binding.subject.code,
        subjectName: binding.subject.name,
        editionId: binding.edition.id,
        editionDisplayName: binding.edition.displayName,
        volumeId: binding.volume.id,
        volumeLabel: binding.volume.volumeLabel,
        nodeId: node.id,
        nodeTitle: node.title,
        contentItems,
      };
    }

    return null;
  }

  private async findFirstLeafNodeId(volumeId: string): Promise<string | null> {
    const node = await this.prismaService.textbookNode.findFirst({
      where: {
        volumeId,
        isLeaf: true,
      },
      orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
      },
    });

    return node?.id ?? null;
  }
}
