import { ApprovalAction, LearningType, Prisma, PushStatus, Subject } from "@prisma/client";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { ApprovePushDto } from "./dto/approve-push.dto";
import { CreatePushDto } from "./dto/create-push.dto";

type TimeWindow = { start: string; end: string };

@Injectable()
export class PushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async createPush(
    user: JwtPayload,
    dto: CreatePushDto
  ): Promise<{ pushId: string; status: PushStatus }> {
    const child = await this.prisma.child.findFirst({
      where: { id: dto.childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const push = await this.prisma.learningPush.create({
      data: {
        childId: dto.childId,
        subject: dto.subject ?? Subject.ENGLISH,
        type: dto.type ?? LearningType.WORD_LEARNING,
        summary: dto.summary,
        reason: dto.reason,
        expectedOutcome: dto.expectedOutcome,
        content: this.toJsonInput(dto.content),
        scheduledAt: new Date(dto.scheduledAt)
      }
    });

    await this.notificationService.notifyFamilyPendingPush(
      child.familyId,
      child.id,
      push.id,
      push.summary
    );
    return { pushId: push.id, status: push.status };
  }

  async getPendingPushes(user: JwtPayload): Promise<
    Array<{
      id: string;
      childId: string;
      childName: string;
      summary: string;
      reason: string;
      expectedOutcome: string;
      status: PushStatus;
      scheduledAt: Date;
      content: Record<string, unknown>;
    }>
  > {
    const pushes = await this.prisma.learningPush.findMany({
      where: {
        status: PushStatus.PENDING_APPROVAL,
        child: { familyId: user.familyId }
      },
      include: { child: true },
      orderBy: { scheduledAt: "asc" }
    });

    return pushes.map((item) => ({
      id: item.id,
      childId: item.childId,
      childName: item.child.name,
      summary: item.summary,
      reason: item.reason,
      expectedOutcome: item.expectedOutcome,
      status: item.status,
      scheduledAt: item.scheduledAt,
      content: item.content as Record<string, unknown>
    }));
  }

  async approvePush(
    user: JwtPayload,
    pushId: string,
    dto: ApprovePushDto
  ): Promise<{ pushId: string; status: PushStatus }> {
    const parent = await this.prisma.parent.findFirst({
      where: { id: user.sub, familyId: user.familyId }
    });
    if (!parent) {
      throw new ForbiddenException("permission denied");
    }

    const push = await this.prisma.learningPush.findFirst({
      where: { id: pushId, child: { familyId: user.familyId } },
      include: { child: true }
    });
    if (!push) {
      throw new NotFoundException("push not found");
    }

    if (push.status !== PushStatus.PENDING_APPROVAL) {
      throw new BadRequestException("push status cannot be approved");
    }

    const nextStatus = this.resolveStatus(dto.action);
    const postponedUntil = dto.postponedUntil ? new Date(dto.postponedUntil) : null;
    if (nextStatus === PushStatus.POSTPONED) {
      if (!postponedUntil || Number.isNaN(postponedUntil.getTime())) {
        throw new BadRequestException("postponedUntil is required when action is POSTPONE");
      }
    }

    await this.prisma.$transaction([
      this.prisma.learningPushApproval.upsert({
        where: { pushId },
        create: {
          pushId,
          parentId: parent.id,
          action: dto.action,
          comment: dto.comment,
          modifiedContent: this.toOptionalNullableJsonInput(dto.modifiedContent)
        },
        update: {
          parentId: parent.id,
          action: dto.action,
          comment: dto.comment,
          modifiedContent: this.toOptionalNullableJsonInput(dto.modifiedContent)
        }
      }),
      this.prisma.learningPush.update({
        where: { id: pushId },
        data: {
          status: nextStatus,
          content: this.toJsonInput(dto.modifiedContent ?? push.content),
          scheduledAt:
            nextStatus === PushStatus.POSTPONED && postponedUntil
              ? postponedUntil
              : push.scheduledAt
        }
      })
    ]);

    if (nextStatus === PushStatus.REJECTED) {
      await this.notificationService.notifyFamilyPushRejected(
        push.child.familyId,
        push.childId,
        push.id,
        push.summary
      );
    }

    return { pushId, status: nextStatus };
  }

  async getPushHistory(
    user: JwtPayload,
    childId: string
  ): Promise<
    Array<{ id: string; status: PushStatus; summary: string; scheduledAt: Date; createdAt: Date }>
  > {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const pushes = await this.prisma.learningPush.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" }
    });

    return pushes.map((item) => ({
      id: item.id,
      status: item.status,
      summary: item.summary,
      scheduledAt: item.scheduledAt,
      createdAt: item.createdAt
    }));
  }

  async runSchedulerForFamily(user: JwtPayload): Promise<{ created: number; skipped: number }> {
    return this.runSchedulerForFamilyId(user.familyId);
  }

  async runAutoDeliveryForFamily(
    user: JwtPayload
  ): Promise<{ delivered: number; skipped: number }> {
    return this.runAutoDeliveryForFamilyId(user.familyId);
  }

  async runPostponedRequeueForFamily(
    user: JwtPayload
  ): Promise<{ requeued: number; skipped: number }> {
    return this.runPostponedRequeueForFamilyId(user.familyId);
  }

  async runExpirationForFamily(user: JwtPayload): Promise<{ expired: number; skipped: number }> {
    return this.runExpirationForFamilyId(user.familyId);
  }

  async runSchedulerForFamilyId(familyId: string): Promise<{ created: number; skipped: number }> {
    const now = new Date();
    const children = await this.prisma.child.findMany({
      where: { familyId },
      include: {
        settings: {
          where: { subject: Subject.ENGLISH },
          take: 1
        }
      }
    });

    let created = 0;
    let skipped = 0;

    for (const child of children) {
      const settings = child.settings[0] ?? null;
      if (
        !this.isWithinScheduledTimeWindow(
          now,
          settings?.weekdayTimeWindows,
          settings?.weekendTimeWindows
        )
      ) {
        skipped += 1;
        continue;
      }

      const activePush = await this.prisma.learningPush.findFirst({
        where: {
          childId: child.id,
          status: {
            in: [
              PushStatus.PENDING_APPROVAL,
              PushStatus.APPROVED,
              PushStatus.MODIFIED,
              PushStatus.POSTPONED,
              PushStatus.DELIVERED
            ]
          }
        }
      });
      if (activePush) {
        skipped += 1;
        continue;
      }

      const wordsPerSession = this.resolveWordsPerSession(settings?.wordsPerSession);
      const dueWordRows = await this.prisma.wordProgress.findMany({
        where: {
          childId: child.id,
          nextReviewAt: { lte: now },
          mastered: false
        },
        include: {
          word: true
        },
        orderBy: [{ nextReviewAt: "asc" }, { updatedAt: "asc" }],
        take: wordsPerSession
      });

      if (dueWordRows.length <= 0) {
        skipped += 1;
        continue;
      }

      const wordList = dueWordRows.map((item) => ({
        value: item.word.value,
        stage: item.stage,
        difficulty: item.word.difficulty,
        nextReviewAt: item.nextReviewAt
      }));

      const push = await this.prisma.learningPush.create({
        data: {
          childId: child.id,
          subject: Subject.ENGLISH,
          type: LearningType.WORD_REVIEW,
          summary: `${child.name} has ${dueWordRows.length} due review words`,
          reason: "Generated by Ebbinghaus due-word scheduler",
          expectedOutcome: "Improve retention by completing due review words",
          content: this.toJsonInput({
            mode: "word_review",
            dueWords: dueWordRows.length,
            words: wordList
          }),
          scheduledAt: now,
          status: settings?.autoApprove ? PushStatus.APPROVED : PushStatus.PENDING_APPROVAL
        }
      });

      if (!settings?.autoApprove) {
        await this.notificationService.notifyFamilyPendingPush(
          familyId,
          child.id,
          push.id,
          push.summary
        );
      }
      created += 1;
    }

    return { created, skipped };
  }

  async runAutoDeliveryForFamilyId(
    familyId: string
  ): Promise<{ delivered: number; skipped: number }> {
    const now = new Date();
    const candidates = await this.prisma.learningPush.findMany({
      where: {
        child: { familyId },
        status: { in: [PushStatus.APPROVED, PushStatus.MODIFIED] },
        scheduledAt: { lte: now }
      },
      include: {
        child: true
      },
      orderBy: { scheduledAt: "asc" }
    });

    let delivered = 0;
    let skipped = 0;

    for (const item of candidates) {
      const updated = await this.prisma.learningPush.update({
        where: { id: item.id },
        data: { status: PushStatus.DELIVERED }
      });
      await this.notificationService.notifyChildPushApproved(
        item.child.familyId,
        item.childId,
        item.id,
        item.summary
      );
      if (updated.status === PushStatus.DELIVERED) {
        delivered += 1;
      } else {
        skipped += 1;
      }
    }

    return { delivered, skipped };
  }

  async runPostponedRequeueForFamilyId(
    familyId: string
  ): Promise<{ requeued: number; skipped: number }> {
    const now = new Date();
    const postponed = await this.prisma.learningPush.findMany({
      where: {
        child: { familyId },
        status: PushStatus.POSTPONED,
        scheduledAt: { lte: now }
      },
      include: { child: true }
    });

    let requeued = 0;
    let skipped = 0;
    for (const item of postponed) {
      const updated = await this.prisma.learningPush.update({
        where: { id: item.id },
        data: { status: PushStatus.PENDING_APPROVAL }
      });
      if (updated.status === PushStatus.PENDING_APPROVAL) {
        await this.notificationService.notifyFamilyPendingPush(
          familyId,
          item.childId,
          item.id,
          item.summary
        );
        requeued += 1;
      } else {
        skipped += 1;
      }
    }

    return { requeued, skipped };
  }

  async runExpirationForFamilyId(familyId: string): Promise<{ expired: number; skipped: number }> {
    const expireHours = Number.parseInt(process.env.PUSH_EXPIRE_HOURS ?? "48", 10);
    const threshold = new Date(Date.now() - Math.max(1, expireHours) * 60 * 60 * 1000);
    const expirableStatuses: PushStatus[] = [
      PushStatus.PENDING_APPROVAL,
      PushStatus.APPROVED,
      PushStatus.MODIFIED,
      PushStatus.POSTPONED,
      PushStatus.DELIVERED
    ];

    const rows = await this.prisma.learningPush.findMany({
      where: {
        child: { familyId },
        status: { in: expirableStatuses },
        scheduledAt: { lt: threshold }
      }
    });

    let expired = 0;
    let skipped = 0;

    for (const item of rows) {
      const updated = await this.prisma.learningPush.update({
        where: { id: item.id },
        data: { status: PushStatus.EXPIRED }
      });
      if (updated.status === PushStatus.EXPIRED) {
        expired += 1;
      } else {
        skipped += 1;
      }
    }

    if (expired > 0) {
      await this.notificationService.notifyFamilySystem(
        familyId,
        "Some learning tasks expired",
        `${expired} task(s) were auto-marked as expired due to timeout`,
        { expired, threshold: threshold.toISOString() }
      );
    }

    return { expired, skipped };
  }

  async deliverPush(
    user: JwtPayload,
    pushId: string
  ): Promise<{ pushId: string; status: PushStatus }> {
    const push = await this.prisma.learningPush.findFirst({
      where: { id: pushId, child: { familyId: user.familyId } },
      include: { child: true }
    });
    if (!push) {
      throw new NotFoundException("push not found");
    }
    if (push.status !== PushStatus.APPROVED && push.status !== PushStatus.MODIFIED) {
      throw new BadRequestException("push status cannot be delivered");
    }

    const updated = await this.prisma.learningPush.update({
      where: { id: push.id },
      data: { status: PushStatus.DELIVERED }
    });
    await this.notificationService.notifyChildPushApproved(
      push.child.familyId,
      push.childId,
      push.id,
      push.summary
    );
    return { pushId: updated.id, status: updated.status };
  }

  async completePush(
    user: JwtPayload,
    pushId: string
  ): Promise<{ pushId: string; status: PushStatus }> {
    const push = await this.prisma.learningPush.findFirst({
      where: { id: pushId, child: { familyId: user.familyId } }
    });
    if (!push) {
      throw new NotFoundException("push not found");
    }
    if (push.status !== PushStatus.DELIVERED) {
      throw new BadRequestException("push status cannot be completed");
    }

    const updated = await this.prisma.learningPush.update({
      where: { id: push.id },
      data: { status: PushStatus.COMPLETED }
    });
    return { pushId: updated.id, status: updated.status };
  }

  async getChildTasks(
    user: JwtPayload,
    childId: string,
    date?: string
  ): Promise<
    Array<{
      id: string;
      summary: string;
      status: PushStatus;
      scheduledAt: Date;
      content: Record<string, unknown>;
    }>
  > {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const where: {
      childId: string;
      status: { in: PushStatus[] };
      scheduledAt?: { gte: Date; lt: Date };
    } = {
      childId,
      status: {
        in: [PushStatus.APPROVED, PushStatus.MODIFIED, PushStatus.DELIVERED]
      }
    };

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        where.scheduledAt = { gte: start, lt: end };
      }
    }

    const rows = await this.prisma.learningPush.findMany({
      where,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }]
    });

    return rows.map((item) => ({
      id: item.id,
      summary: item.summary,
      status: item.status,
      scheduledAt: item.scheduledAt,
      content: item.content as Record<string, unknown>
    }));
  }

  private resolveWordsPerSession(configured: number | null | undefined): number {
    if (typeof configured !== "number" || Number.isNaN(configured)) {
      return 10;
    }
    return Math.max(1, Math.min(50, Math.floor(configured)));
  }

  private isWithinScheduledTimeWindow(
    now: Date,
    weekdayRaw: unknown,
    weekendRaw: unknown
  ): boolean {
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const windows = isWeekend
      ? this.normalizeTimeWindows(weekendRaw)
      : this.normalizeTimeWindows(weekdayRaw);
    if (windows.length === 0) {
      return true;
    }

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return windows.some((window) => this.isTimeInWindow(nowMinutes, window));
  }

  private normalizeTimeWindows(raw: unknown): TimeWindow[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    const windows: TimeWindow[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const candidate = item as { start?: unknown; end?: unknown };
      if (typeof candidate.start !== "string" || typeof candidate.end !== "string") {
        continue;
      }
      if (!this.isValidTime(candidate.start) || !this.isValidTime(candidate.end)) {
        continue;
      }
      windows.push({ start: candidate.start, end: candidate.end });
    }
    return windows;
  }

  private isTimeInWindow(nowMinutes: number, window: TimeWindow): boolean {
    const start = this.toMinutes(window.start);
    const end = this.toMinutes(window.end);
    if (start === end) {
      return false;
    }
    if (start < end) {
      return nowMinutes >= start && nowMinutes < end;
    }
    return nowMinutes >= start || nowMinutes < end;
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map((item) => Number(item));
    return hours * 60 + minutes;
  }

  private toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
    if (value === null) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private toOptionalNullableJsonInput(
    value: unknown
  ): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private resolveStatus(action: ApprovalAction): PushStatus {
    if (action === ApprovalAction.APPROVE) {
      return PushStatus.APPROVED;
    }
    if (action === ApprovalAction.REJECT) {
      return PushStatus.REJECTED;
    }
    if (action === ApprovalAction.MODIFY) {
      return PushStatus.MODIFIED;
    }
    return PushStatus.POSTPONED;
  }
}
