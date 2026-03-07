import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async rewardWordSession(
    childId: string,
    accuracy: number
  ): Promise<{
    points: number;
    totalPoints: number;
    level: number;
    streakDays: number;
  }> {
    const points = this.calculatePoints(accuracy);
    const today = new Date();
    const todayDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );

    let profile = await this.prisma.gameProfile.findUnique({
      where: { childId }
    });

    if (!profile) {
      profile = await this.prisma.gameProfile.create({
        data: {
          childId,
          points: 0,
          level: 1,
          streakDays: 0
        }
      });
    }

    const streakDays = this.nextStreak(profile.lastStudyDate, profile.streakDays, todayDate);
    const totalPoints = profile.points + points;
    const level = this.calculateLevel(totalPoints);

    const updated = await this.prisma.gameProfile.update({
      where: { id: profile.id },
      data: {
        points: totalPoints,
        level,
        streakDays,
        lastStudyDate: todayDate,
        pointLogs: {
          create: {
            delta: points,
            reason: "WORD_SESSION_COMPLETED"
          }
        }
      }
    });

    return {
      points,
      totalPoints: updated.points,
      level: updated.level,
      streakDays: updated.streakDays
    };
  }

  async getProfile(
    user: JwtPayload,
    childId: string
  ): Promise<{
    childId: string;
    points: number;
    level: number;
    streakDays: number;
  }> {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const profile = await this.prisma.gameProfile.findUnique({
      where: { childId }
    });

    if (!profile) {
      return { childId, points: 0, level: 1, streakDays: 0 };
    }

    return {
      childId,
      points: profile.points,
      level: profile.level,
      streakDays: profile.streakDays
    };
  }

  private calculatePoints(accuracy: number): number {
    const base = 20;
    const bonus = Math.round(accuracy / 10);
    return base + bonus;
  }

  private calculateLevel(totalPoints: number): number {
    if (totalPoints >= 5000) return 5;
    if (totalPoints >= 1500) return 4;
    if (totalPoints >= 500) return 3;
    if (totalPoints >= 100) return 2;
    return 1;
  }

  private nextStreak(lastStudyDate: Date | null, currentStreak: number, todayDate: Date): number {
    if (!lastStudyDate) return 1;
    const last = new Date(
      Date.UTC(
        lastStudyDate.getUTCFullYear(),
        lastStudyDate.getUTCMonth(),
        lastStudyDate.getUTCDate()
      )
    );
    const diffDays = Math.floor((todayDate.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays <= 0) return currentStreak;
    if (diffDays === 1) return currentStreak + 1;
    return 1;
  }
}
