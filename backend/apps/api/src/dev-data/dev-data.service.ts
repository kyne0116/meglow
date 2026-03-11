import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthSession } from '../common/interfaces/auth-session.interface';

interface ParentRecord {
  id: string;
  phone: string;
}

interface MembershipRecord {
  familyId: string;
  parentId: string;
  role: 'OWNER' | 'MEMBER';
}

export interface ChildRecord {
  id: string;
  familyId: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string | null;
  grade: number;
  k12Stage:
    | 'LOWER_PRIMARY'
    | 'MIDDLE_PRIMARY'
    | 'UPPER_PRIMARY'
    | 'JUNIOR_HIGH';
  avatarUrl: string | null;
}

interface TimeWindow {
  start: string;
  end: string;
}

export interface ChildSettingsRecord {
  id: string;
  childId: string;
  subject: 'ENGLISH';
  autoApprove: boolean;
  weekdayTimeWindows: TimeWindow[];
  weekendTimeWindows: TimeWindow[];
  dailyDurationMin: number;
  wordsPerSession: number;
}

export interface PushRecord {
  id: string;
  childId: string;
  summary: string;
  reason: string;
  expectedOutcome: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'MODIFIED' | 'REJECTED';
  scheduledAt: string;
  content: Record<string, unknown>;
}

export interface TaskRecord {
  id: string;
  pushId: string;
  childId: string;
  summary: string;
  status: 'APPROVED' | 'MODIFIED' | 'DELIVERED' | 'COMPLETED';
  scheduledAt: string;
  content: Record<string, unknown>;
}

interface VerificationCodeRecord {
  code: string;
  createdAt: number;
  expiresAt: number;
  usedAt: number | null;
}

@Injectable()
export class DevDataService {
  private readonly parentsByPhone = new Map<string, ParentRecord>();
  private readonly membershipsByParentId = new Map<string, MembershipRecord>();
  private readonly childrenByFamilyId = new Map<string, ChildRecord[]>();
  private readonly settingsByChildId = new Map<string, ChildSettingsRecord>();
  private readonly pushesByFamilyId = new Map<string, PushRecord[]>();
  private readonly tasksByFamilyId = new Map<string, TaskRecord[]>();
  private readonly verificationCodes = new Map<string, VerificationCodeRecord>();
  private readonly sessionsByToken = new Map<string, AuthSession>();

  sendVerificationCode(phone: string): { success: true; expiresInSec: number } {
    this.assertPhone(phone);
    const existing = this.verificationCodes.get(phone);
    const now = Date.now();

    if (existing && now - existing.createdAt < 60_000) {
      throw new ConflictException({
        code: 'RATE_LIMITED',
        message: 'verification code requested too frequently',
        details: {},
      });
    }

    this.verificationCodes.set(phone, {
      code: '123456',
      createdAt: now,
      expiresAt: now + 60_000,
      usedAt: null,
    });

    return {
      success: true,
      expiresInSec: 60,
    };
  }

  login(phone: string, verificationCode: string): AuthSession {
    this.assertPhone(phone);
    const now = Date.now();
    const code = this.verificationCodes.get(phone);
    const isValid =
      verificationCode === '123456' ||
      Boolean(
        code &&
          code.code === verificationCode &&
          code.expiresAt >= now &&
          code.usedAt === null,
      );

    if (!isValid) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'invalid verification code',
        details: {},
      });
    }

    if (code) {
      code.usedAt = now;
    }

    let parent = this.parentsByPhone.get(phone);
    let membership: MembershipRecord | undefined;

    if (!parent) {
      const familyId = randomUUID();
      parent = {
        id: randomUUID(),
        phone,
      };
      membership = {
        familyId,
        parentId: parent.id,
        role: 'OWNER',
      };

      this.parentsByPhone.set(phone, parent);
      this.membershipsByParentId.set(parent.id, membership);
      this.childrenByFamilyId.set(familyId, []);
      this.pushesByFamilyId.set(familyId, []);
      this.tasksByFamilyId.set(familyId, []);
    } else {
      membership = this.membershipsByParentId.get(parent.id);
    }

    if (!membership) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'family membership not found',
        details: {},
      });
    }

    const session: AuthSession = {
      token: `dev-${randomUUID()}`,
      parentId: parent.id,
      familyId: membership.familyId,
      phone: parent.phone,
      role: membership.role,
    };
    this.sessionsByToken.set(session.token, session);
    return session;
  }

  getSession(token: string): AuthSession | null {
    return this.sessionsByToken.get(token) ?? null;
  }

  getChildren(familyId: string): ChildRecord[] {
    return [...(this.childrenByFamilyId.get(familyId) ?? [])];
  }

  createChild(
    familyId: string,
    payload: {
      name: string;
      gender: 'MALE' | 'FEMALE';
      birthDate?: string | null;
      grade: number;
      avatarUrl?: string | null;
    },
  ): ChildRecord {
    const children = this.childrenByFamilyId.get(familyId);
    if (!children) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'family not found',
        details: {},
      });
    }

    if (children.length >= 5) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'family child limit reached',
        details: {},
      });
    }

    if (!payload.name.trim()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'name is required',
        details: {},
      });
    }

    if (!Number.isInteger(payload.grade) || payload.grade < 1 || payload.grade > 9) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'grade must be between 1 and 9',
        details: {},
      });
    }

    const child: ChildRecord = {
      id: randomUUID(),
      familyId,
      name: payload.name.trim(),
      gender: payload.gender,
      birthDate: payload.birthDate ?? null,
      grade: payload.grade,
      k12Stage: this.toK12Stage(payload.grade),
      avatarUrl: payload.avatarUrl ?? null,
    };
    children.push(child);
    this.settingsByChildId.set(child.id, this.createDefaultSettings(child.id));
    return child;
  }

  getChild(familyId: string, childId: string): ChildRecord {
    return { ...this.requireChild(familyId, childId) };
  }

  getChildSettings(familyId: string, childId: string): ChildSettingsRecord {
    this.requireChild(familyId, childId);
    const current =
      this.settingsByChildId.get(childId) ?? this.createDefaultSettings(childId);
    this.settingsByChildId.set(childId, current);
    return {
      ...current,
      weekdayTimeWindows: [...current.weekdayTimeWindows],
      weekendTimeWindows: [...current.weekendTimeWindows],
    };
  }

  updateChildSettings(
    familyId: string,
    childId: string,
    payload: Partial<{
      autoApprove: boolean;
      weekdayTimeWindows: TimeWindow[];
      weekendTimeWindows: TimeWindow[];
      dailyDurationMin: number;
      wordsPerSession: number;
    }>,
  ): ChildSettingsRecord {
    const current = this.getChildSettings(familyId, childId);
    const next: ChildSettingsRecord = {
      ...current,
      autoApprove: payload.autoApprove ?? current.autoApprove,
      weekdayTimeWindows:
        payload.weekdayTimeWindows ?? current.weekdayTimeWindows,
      weekendTimeWindows:
        payload.weekendTimeWindows ?? current.weekendTimeWindows,
      dailyDurationMin:
        payload.dailyDurationMin ?? current.dailyDurationMin,
      wordsPerSession: payload.wordsPerSession ?? current.wordsPerSession,
    };

    this.assertSettings(next);
    this.settingsByChildId.set(childId, next);
    return this.getChildSettings(familyId, childId);
  }

  getPendingPushes(
    familyId: string,
  ): Array<PushRecord & { childName: string }> {
    this.ensureSeedPushes(familyId);
    const children = this.childrenByFamilyId.get(familyId) ?? [];
    const names = new Map(children.map((child) => [child.id, child.name]));

    return (this.pushesByFamilyId.get(familyId) ?? [])
      .filter((push) => push.status === 'PENDING_APPROVAL')
      .map((push) => ({
        ...push,
        childName: names.get(push.childId) ?? 'Unknown',
      }));
  }

  approvePush(
    familyId: string,
    pushId: string,
    payload: {
      action: 'APPROVE' | 'REJECT' | 'MODIFY' | 'POSTPONE';
      modifiedContent?: Record<string, unknown>;
      postponedUntil?: string;
    },
  ): { pushId: string; status: string } {
    const push = this.requirePush(familyId, pushId);
    const tasks = this.tasksByFamilyId.get(familyId) ?? [];

    if (payload.action === 'APPROVE') {
      push.status = 'APPROVED';
      tasks.push(this.createTaskFromPush(push, 'APPROVED'));
    }

    if (payload.action === 'MODIFY') {
      if (!payload.modifiedContent) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'modifiedContent is required for MODIFY',
          details: {},
        });
      }
      push.status = 'MODIFIED';
      push.content = payload.modifiedContent;
      tasks.push(this.createTaskFromPush(push, 'MODIFIED'));
    }

    if (payload.action === 'REJECT') {
      push.status = 'REJECTED';
    }

    if (payload.action === 'POSTPONE') {
      if (!payload.postponedUntil) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'postponedUntil is required for POSTPONE',
          details: {},
        });
      }
      push.scheduledAt = payload.postponedUntil;
      push.status = 'PENDING_APPROVAL';
      return {
        pushId,
        status: 'POSTPONED',
      };
    }

    this.tasksByFamilyId.set(familyId, tasks);
    return {
      pushId,
      status: push.status,
    };
  }

  getTasks(
    familyId: string,
    childId: string,
    date?: string,
  ): Array<Omit<TaskRecord, 'pushId'>> {
    this.requireChild(familyId, childId);
    return (this.tasksByFamilyId.get(familyId) ?? [])
      .filter((task) => task.childId === childId)
      .filter((task) => task.status !== 'COMPLETED')
      .filter((task) => (date ? task.scheduledAt.startsWith(date) : true))
      .map(({ pushId: _pushId, ...task }) => ({ ...task }));
  }

  deliverPush(familyId: string, pushId: string): { pushId: string; status: string } {
    const task = this.requireTaskByPushId(familyId, pushId);
    if (task.status !== 'APPROVED' && task.status !== 'MODIFIED') {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'task cannot be delivered from current status',
        details: {},
      });
    }

    task.status = 'DELIVERED';
    return {
      pushId,
      status: task.status,
    };
  }

  completePush(familyId: string, pushId: string): { pushId: string; status: string } {
    const task = this.requireTaskByPushId(familyId, pushId);
    if (task.status !== 'DELIVERED') {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'task cannot be completed from current status',
        details: {},
      });
    }

    task.status = 'COMPLETED';
    return {
      pushId,
      status: task.status,
    };
  }

  private createDefaultSettings(childId: string): ChildSettingsRecord {
    return {
      id: randomUUID(),
      childId,
      subject: 'ENGLISH',
      autoApprove: false,
      weekdayTimeWindows: [{ start: '18:30', end: '20:00' }],
      weekendTimeWindows: [{ start: '09:00', end: '10:30' }],
      dailyDurationMin: 20,
      wordsPerSession: 10,
    };
  }

  private requireChild(familyId: string, childId: string): ChildRecord {
    const child = (this.childrenByFamilyId.get(familyId) ?? []).find(
      (item) => item.id === childId,
    );
    if (!child) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'child not found',
        details: {},
      });
    }
    return child;
  }

  private requirePush(familyId: string, pushId: string): PushRecord {
    const push = (this.pushesByFamilyId.get(familyId) ?? []).find(
      (item) => item.id === pushId,
    );
    if (!push) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'push not found',
        details: {},
      });
    }
    return push;
  }

  private requireTaskByPushId(familyId: string, pushId: string): TaskRecord {
    const task = (this.tasksByFamilyId.get(familyId) ?? []).find(
      (item) => item.pushId === pushId,
    );
    if (!task) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'task not found for push',
        details: {},
      });
    }
    return task;
  }

  private ensureSeedPushes(familyId: string): void {
    const pushes = this.pushesByFamilyId.get(familyId);
    const children = this.childrenByFamilyId.get(familyId) ?? [];

    if (!pushes || children.length === 0) {
      return;
    }

    if (pushes.some((item) => item.status === 'PENDING_APPROVAL')) {
      return;
    }

    for (const child of children) {
      const settings =
        this.settingsByChildId.get(child.id) ?? this.createDefaultSettings(child.id);
      this.settingsByChildId.set(child.id, settings);
      pushes.push({
        id: randomUUID(),
        childId: child.id,
        summary: `${child.name} 今日英语学习任务`,
        reason: `${settings.wordsPerSession} 个单词适合当前学习窗口`,
        expectedOutcome: '完成后预计提升基础词汇掌握率和发音熟悉度',
        status: 'PENDING_APPROVAL',
        scheduledAt: new Date().toISOString(),
        content: {
          mode: 'word_review',
          dueWords: Math.max(1, Math.floor(settings.wordsPerSession / 2)),
          newWords: Math.max(1, Math.ceil(settings.wordsPerSession / 2)),
          words: [{ value: 'apple' }, { value: 'banana' }, { value: 'animal' }],
          coachHint: 'focus on everyday vocabulary',
          priority: 'normal',
        },
      });
    }
  }

  private createTaskFromPush(
    push: PushRecord,
    status: 'APPROVED' | 'MODIFIED',
  ): TaskRecord {
    return {
      id: randomUUID(),
      pushId: push.id,
      childId: push.childId,
      summary: push.summary,
      status,
      scheduledAt: push.scheduledAt,
      content: { ...push.content },
    };
  }

  private toK12Stage(
    grade: number,
  ): 'LOWER_PRIMARY' | 'MIDDLE_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_HIGH' {
    if (grade <= 2) {
      return 'LOWER_PRIMARY';
    }
    if (grade <= 4) {
      return 'MIDDLE_PRIMARY';
    }
    if (grade <= 6) {
      return 'UPPER_PRIMARY';
    }
    return 'JUNIOR_HIGH';
  }

  private assertPhone(phone: string): void {
    if (!/^1\d{10}$/.test(phone.trim())) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'phone must be a valid mainland China mobile number',
        details: {},
      });
    }
  }

  private assertSettings(settings: ChildSettingsRecord): void {
    if (
      !Number.isInteger(settings.dailyDurationMin) ||
      settings.dailyDurationMin < 5 ||
      settings.dailyDurationMin > 240
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'dailyDurationMin must be between 5 and 240',
        details: {},
      });
    }

    if (
      !Number.isInteger(settings.wordsPerSession) ||
      settings.wordsPerSession < 1 ||
      settings.wordsPerSession > 50
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'wordsPerSession must be between 1 and 50',
        details: {},
      });
    }

    for (const window of [
      ...settings.weekdayTimeWindows,
      ...settings.weekendTimeWindows,
    ]) {
      if (
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(window.start) ||
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(window.end) ||
        window.start === window.end
      ) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'time windows must use HH:mm format and start must not equal end',
          details: {},
        });
      }
    }
  }
}
