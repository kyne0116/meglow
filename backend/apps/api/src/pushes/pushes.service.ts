import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PushStatus, SubjectType, TaskStatus } from '@prisma/client';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../persistence/prisma/prisma.service';
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

        if (existingTask) {
          await prisma.learningTask.update({
            where: {
              id: existingTask.id,
            },
            data: {
              summary: push.summary,
              status:
                nextStatus === PushStatus.APPROVED
                  ? TaskStatus.APPROVED
                  : TaskStatus.MODIFIED,
              scheduledAt,
              contentJson,
            },
          });
        } else {
          await prisma.learningTask.create({
            data: {
              pushId: push.id,
              childId: push.childId,
              summary: push.summary,
              status:
                nextStatus === PushStatus.APPROVED
                  ? TaskStatus.APPROVED
                  : TaskStatus.MODIFIED,
              scheduledAt,
              contentJson,
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
      const existingOpenPushCount = await this.prismaService.learningPush.count({
        where: {
          childId: child.id,
          status: {
            in: [
              PushStatus.PENDING_APPROVAL,
              PushStatus.APPROVED,
              PushStatus.MODIFIED,
              PushStatus.POSTPONED,
            ],
          },
        },
      });

      const existingOpenTaskCount = await this.prismaService.learningTask.count({
        where: {
          childId: child.id,
          status: {
            in: [TaskStatus.APPROVED, TaskStatus.MODIFIED, TaskStatus.DELIVERED],
          },
        },
      });

      if (existingOpenPushCount > 0 || existingOpenTaskCount > 0) {
        continue;
      }

      const settings =
        child.learningSettings[0] ??
        (await this.prismaService.childLearningSettings.create({
          data: {
            childId: child.id,
            subject: SubjectType.ENGLISH,
            autoApprove: false,
            weekdayTimeWindows: [{ start: '18:30', end: '20:00' }],
            weekendTimeWindows: [{ start: '09:00', end: '10:30' }],
            dailyDurationMin: 20,
            wordsPerSession: 10,
          },
        }));

      const recommendedWords = await this.contentService.recommendWordsForChild(
        child.id,
        settings.wordsPerSession,
      );

      if (recommendedWords.length === 0) {
        continue;
      }

      const dueWords = recommendedWords.filter((word) => word.kind === 'REVIEW').length;
      const newWords = recommendedWords.filter((word) => word.kind === 'NEW').length;
      const status = settings.autoApprove
        ? PushStatus.APPROVED
        : PushStatus.PENDING_APPROVAL;

      const createdPush = await this.prismaService.learningPush.create({
        data: {
          childId: child.id,
          summary: `${child.name} 今日英语学习任务`,
          reason:
            dueWords > 0
              ? `${dueWords} 个单词到达复习节点，补充 ${newWords} 个新词保持节奏`
              : `安排 ${newWords} 个新单词进入今日学习`,
          expectedOutcome: `完成后预计掌握 ${recommendedWords.length} 个词的词义与拼写`,
          status,
          scheduledAt: new Date(),
          contentJson: {
            mode: 'word_learning',
            dueWords,
            newWords,
            words: recommendedWords.map((word) => ({
              id: word.id,
              value: word.value,
              meaningZh: word.meaningZh,
              phonetic: word.phonetic,
              kind: word.kind,
            })),
            coachHint:
              dueWords > 0
                ? 'review due words first, then unlock new ones'
                : 'focus on meaning recognition and spelling',
            priority: dueWords > 0 ? 'high' : 'normal',
          },
          createdBy: 'rule_engine',
        },
      });

      if (settings.autoApprove) {
        await this.prismaService.learningTask.create({
          data: {
            pushId: createdPush.id,
            childId: child.id,
            summary: createdPush.summary,
            status: TaskStatus.APPROVED,
            scheduledAt: createdPush.scheduledAt,
            contentJson: createdPush.contentJson as Prisma.InputJsonValue,
          },
        });
      }
    }
  }
}
