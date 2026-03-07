import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ChildLearningSettings, Gender, K12Stage, Prisma, Subject } from "@prisma/client";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";
import { CreateChildDto } from "./dto/create-child.dto";
import { TimeWindowDto, UpsertChildSettingsDto } from "./dto/upsert-child-settings.dto";

type TimeWindow = { start: string; end: string };

type ChildSummary = {
  id: string;
  familyId: string;
  name: string;
  gender: string;
  grade: number;
  k12Stage: string;
};
type ChildProfileView = {
  child: ChildSummary;
  profile: {
    childId: string;
    learningStyle: Record<string, number>;
    attentionSpan: number;
    interests: string[];
  };
};
type ChildSettingsView = {
  childId: string;
  subject: Subject;
  autoApprove: boolean;
  weekdayTimeWindows: TimeWindow[];
  weekendTimeWindows: TimeWindow[];
  dailyDurationMin: number;
  wordsPerSession: number;
};

@Injectable()
export class ChildService {
  constructor(private readonly prisma: PrismaService) {}

  async createChild(user: JwtPayload, dto: CreateChildDto): Promise<ChildSummary> {
    const family = await this.prisma.family.findUnique({
      where: { id: user.familyId },
      include: { children: true }
    });
    if (!family) {
      throw new NotFoundException("family not found");
    }

    if (family.children.length >= 3) {
      throw new BadRequestException("a family can have at most 3 children");
    }

    const child = await this.prisma.child.create({
      data: {
        familyId: user.familyId,
        name: dto.name,
        gender: dto.gender as Gender,
        birthDate: new Date(dto.birthDate),
        grade: dto.grade,
        k12Stage: this.mapK12Stage(dto.grade),
        profile: {
          create: {
            learningStyle: { visual: 0.5, auditory: 0.5, kinesthetic: 0.5 },
            attentionSpan: 15,
            interests: []
          }
        }
      }
    });

    return {
      id: child.id,
      familyId: child.familyId,
      name: child.name,
      gender: child.gender,
      grade: child.grade,
      k12Stage: child.k12Stage
    };
  }

  async listChildren(user: JwtPayload): Promise<ChildSummary[]> {
    const children = await this.prisma.child.findMany({
      where: { familyId: user.familyId },
      orderBy: { createdAt: "asc" }
    });

    return children.map((item) => ({
      id: item.id,
      familyId: item.familyId,
      name: item.name,
      gender: item.gender,
      grade: item.grade,
      k12Stage: item.k12Stage
    }));
  }

  async getChildProfile(user: JwtPayload, childId: string): Promise<ChildProfileView> {
    const child = await this.prisma.child.findFirst({
      where: {
        id: childId,
        familyId: user.familyId
      },
      include: {
        profile: true
      }
    });

    if (!child) {
      throw new NotFoundException("child not found");
    }

    if (!child.profile) {
      throw new NotFoundException("child profile not found");
    }

    return {
      child: {
        id: child.id,
        familyId: child.familyId,
        name: child.name,
        gender: child.gender,
        grade: child.grade,
        k12Stage: child.k12Stage
      },
      profile: {
        childId: child.profile.childId,
        learningStyle: (child.profile.learningStyle ?? {
          visual: 0.5,
          auditory: 0.5,
          kinesthetic: 0.5
        }) as Record<string, number>,
        attentionSpan: child.profile.attentionSpan ?? 15,
        interests: (child.profile.interests ?? []) as string[]
      }
    };
  }

  async getSettings(user: JwtPayload, childId: string): Promise<ChildSettingsView> {
    const child = await this.ensureChildInFamily(user, childId);
    const settings = await this.prisma.childLearningSettings.findUnique({
      where: {
        childId_subject: {
          childId: child.id,
          subject: Subject.ENGLISH
        }
      }
    });

    return this.toSettingsView(child.id, settings);
  }

  async upsertSettings(
    user: JwtPayload,
    childId: string,
    dto: UpsertChildSettingsDto
  ): Promise<ChildSettingsView> {
    const child = await this.ensureChildInFamily(user, childId);
    const existing = await this.prisma.childLearningSettings.findUnique({
      where: {
        childId_subject: {
          childId: child.id,
          subject: Subject.ENGLISH
        }
      }
    });

    const weekdayTimeWindows = dto.weekdayTimeWindows
      ? this.validateAndNormalizeTimeWindows(dto.weekdayTimeWindows)
      : this.normalizeTimeWindows(existing?.weekdayTimeWindows);
    const weekendTimeWindows = dto.weekendTimeWindows
      ? this.validateAndNormalizeTimeWindows(dto.weekendTimeWindows)
      : this.normalizeTimeWindows(existing?.weekendTimeWindows);

    const record = await this.prisma.childLearningSettings.upsert({
      where: {
        childId_subject: {
          childId: child.id,
          subject: Subject.ENGLISH
        }
      },
      create: {
        childId: child.id,
        subject: Subject.ENGLISH,
        autoApprove: dto.autoApprove ?? false,
        weekdayTimeWindows: weekdayTimeWindows as unknown as Prisma.InputJsonValue,
        weekendTimeWindows: weekendTimeWindows as unknown as Prisma.InputJsonValue,
        dailyDurationMin: dto.dailyDurationMin ?? 20,
        wordsPerSession: dto.wordsPerSession ?? 10
      },
      update: {
        autoApprove: dto.autoApprove ?? existing?.autoApprove ?? false,
        weekdayTimeWindows: weekdayTimeWindows as unknown as Prisma.InputJsonValue,
        weekendTimeWindows: weekendTimeWindows as unknown as Prisma.InputJsonValue,
        dailyDurationMin: dto.dailyDurationMin ?? existing?.dailyDurationMin ?? 20,
        wordsPerSession: dto.wordsPerSession ?? existing?.wordsPerSession ?? 10
      }
    });

    return this.toSettingsView(child.id, record);
  }

  private async ensureChildInFamily(user: JwtPayload, childId: string): Promise<{ id: string }> {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId },
      select: { id: true }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }
    return child;
  }

  private toSettingsView(
    childId: string,
    settings: ChildLearningSettings | null
  ): ChildSettingsView {
    return {
      childId,
      subject: Subject.ENGLISH,
      autoApprove: settings?.autoApprove ?? false,
      weekdayTimeWindows: this.normalizeTimeWindows(settings?.weekdayTimeWindows),
      weekendTimeWindows: this.normalizeTimeWindows(settings?.weekendTimeWindows),
      dailyDurationMin: settings?.dailyDurationMin ?? 20,
      wordsPerSession: settings?.wordsPerSession ?? 10
    };
  }

  private normalizeTimeWindows(input: unknown): TimeWindow[] {
    if (!Array.isArray(input)) {
      return [];
    }

    const windows: TimeWindow[] = [];
    for (const item of input) {
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

  private validateAndNormalizeTimeWindows(input: TimeWindowDto[]): TimeWindow[] {
    const windows = this.normalizeTimeWindows(input);
    for (const window of windows) {
      if (this.toMinutes(window.start) === this.toMinutes(window.end)) {
        throw new BadRequestException("time window start cannot equal end");
      }
    }
    return windows;
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map((item) => Number(item));
    return hours * 60 + minutes;
  }

  private mapK12Stage(grade: number): K12Stage {
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
}
