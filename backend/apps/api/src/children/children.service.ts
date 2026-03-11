import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { K12Stage, Prisma, SubjectType } from '@prisma/client';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import {
  TimeWindowDto,
  UpsertChildLearningSettingsDto,
} from './dto/upsert-child-learning-settings.dto';

type TimeWindow = {
  start: string;
  end: string;
};

export interface ChildRecord {
  id: string;
  familyId: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string | null;
  grade: number;
  k12Stage: 'LOWER_PRIMARY' | 'MIDDLE_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_HIGH';
  avatarUrl: string | null;
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

@Injectable()
export class ChildrenService {
  constructor(private readonly prismaService: PrismaService) {}

  async getChildren(familyId: string): Promise<ChildRecord[]> {
    const children = await this.prismaService.child.findMany({
      where: {
        familyId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return children.map((child) => this.toChildRecord(child));
  }

  async createChild(familyId: string, payload: CreateChildDto): Promise<ChildRecord> {
    const family = await this.prismaService.family.findUnique({
      where: {
        id: familyId,
      },
      select: {
        id: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!family) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'family not found',
        details: {},
      });
    }

    if (family._count.children >= 5) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'family child limit reached',
        details: {},
      });
    }

    const child = await this.prismaService.$transaction(async (prisma) => {
      const createdChild = await prisma.child.create({
        data: {
          familyId,
          name: payload.name.trim(),
          gender: payload.gender,
          birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
          grade: payload.grade,
          k12Stage: this.toK12Stage(payload.grade),
          avatarUrl: payload.avatarUrl ?? null,
        },
      });

      await prisma.childProfile.create({
        data: {
          childId: createdChild.id,
          learningMemoryJson: {},
          cognitiveMemoryJson: {},
          personalityMemoryJson: {},
          teachingStrategyJson: {},
        },
      });

      await prisma.childGameProfile.create({
        data: {
          childId: createdChild.id,
        },
      });

      await prisma.childLearningSettings.create({
        data: {
          childId: createdChild.id,
          ...this.defaultSettingsData(),
        },
      });

      return createdChild;
    });

    return this.toChildRecord(child);
  }

  async getChild(familyId: string, childId: string): Promise<ChildRecord> {
    const child = await this.prismaService.child.findFirst({
      where: {
        id: childId,
        familyId,
      },
    });

    if (!child) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'child not found',
        details: {},
      });
    }

    return this.toChildRecord(child);
  }

  async getSettings(familyId: string, childId: string): Promise<ChildSettingsRecord> {
    await this.ensureChildBelongsToFamily(familyId, childId);
    const settings = await this.prismaService.childLearningSettings.upsert({
      where: {
        childId_subject: {
          childId,
          subject: SubjectType.ENGLISH,
        },
      },
      update: {},
      create: {
        childId,
        ...this.defaultSettingsData(),
      },
    });

    return this.toChildSettingsRecord(settings);
  }

  async updateSettings(
    familyId: string,
    childId: string,
    payload: UpsertChildLearningSettingsDto,
  ): Promise<ChildSettingsRecord> {
    await this.ensureChildBelongsToFamily(familyId, childId);

    if (payload.weekdayTimeWindows) {
      this.assertTimeWindows(payload.weekdayTimeWindows);
    }

    if (payload.weekendTimeWindows) {
      this.assertTimeWindows(payload.weekendTimeWindows);
    }

    const currentSettings = await this.getSettings(familyId, childId);
    const settings = await this.prismaService.childLearningSettings.upsert({
      where: {
        childId_subject: {
          childId,
          subject: SubjectType.ENGLISH,
        },
      },
      update: {
        autoApprove: payload.autoApprove ?? currentSettings.autoApprove,
        weekdayTimeWindows: (payload.weekdayTimeWindows ??
          currentSettings.weekdayTimeWindows) as unknown as Prisma.InputJsonValue,
        weekendTimeWindows: (payload.weekendTimeWindows ??
          currentSettings.weekendTimeWindows) as unknown as Prisma.InputJsonValue,
        dailyDurationMin:
          payload.dailyDurationMin ?? currentSettings.dailyDurationMin,
        wordsPerSession:
          payload.wordsPerSession ?? currentSettings.wordsPerSession,
      },
      create: {
        childId,
        subject: SubjectType.ENGLISH,
        autoApprove: payload.autoApprove ?? currentSettings.autoApprove,
        weekdayTimeWindows: (payload.weekdayTimeWindows ??
          currentSettings.weekdayTimeWindows) as unknown as Prisma.InputJsonValue,
        weekendTimeWindows: (payload.weekendTimeWindows ??
          currentSettings.weekendTimeWindows) as unknown as Prisma.InputJsonValue,
        dailyDurationMin:
          payload.dailyDurationMin ?? currentSettings.dailyDurationMin,
        wordsPerSession:
          payload.wordsPerSession ?? currentSettings.wordsPerSession,
      },
    });

    return this.toChildSettingsRecord(settings);
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

  private toChildRecord(child: {
    id: string;
    familyId: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: Date | null;
    grade: number;
    k12Stage: K12Stage;
    avatarUrl: string | null;
  }): ChildRecord {
    return {
      id: child.id,
      familyId: child.familyId,
      name: child.name,
      gender: child.gender,
      birthDate: child.birthDate?.toISOString() ?? null,
      grade: child.grade,
      k12Stage: child.k12Stage,
      avatarUrl: child.avatarUrl,
    };
  }

  private toChildSettingsRecord(settings: {
    id: string;
    childId: string;
    subject: SubjectType;
    autoApprove: boolean;
    weekdayTimeWindows: unknown;
    weekendTimeWindows: unknown;
    dailyDurationMin: number;
    wordsPerSession: number;
  }): ChildSettingsRecord {
    return {
      id: settings.id,
      childId: settings.childId,
      subject: settings.subject,
      autoApprove: settings.autoApprove,
      weekdayTimeWindows: settings.weekdayTimeWindows as TimeWindow[],
      weekendTimeWindows: settings.weekendTimeWindows as TimeWindow[],
      dailyDurationMin: settings.dailyDurationMin,
      wordsPerSession: settings.wordsPerSession,
    };
  }

  private defaultSettingsData() {
    return {
      subject: SubjectType.ENGLISH,
      autoApprove: false,
      weekdayTimeWindows: [{ start: '18:30', end: '20:00' }],
      weekendTimeWindows: [{ start: '09:00', end: '10:30' }],
      dailyDurationMin: 20,
      wordsPerSession: 10,
    };
  }

  private toK12Stage(grade: number): K12Stage {
    if (grade <= 2) {
      return K12Stage.LOWER_PRIMARY;
    }
    if (grade <= 4) {
      return K12Stage.MIDDLE_PRIMARY;
    }
    if (grade <= 6) {
      return K12Stage.UPPER_PRIMARY;
    }
    return K12Stage.JUNIOR_HIGH;
  }

  private assertTimeWindows(timeWindows: TimeWindowDto[]): void {
    for (const window of timeWindows) {
      if (window.start === window.end) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'time windows must use different start and end values',
          details: {},
        });
      }
    }
  }
}
