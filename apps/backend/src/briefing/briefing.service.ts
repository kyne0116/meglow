import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BriefingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async generateForSession(sessionId: string): Promise<{
    briefingId: string;
    headline: string;
    summary: string;
    accuracy: number;
  }> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { child: true, briefing: true }
    });
    if (!session) {
      throw new NotFoundException("学习会话不存在");
    }

    if (session.briefing) {
      return {
        briefingId: session.briefing.id,
        headline: session.briefing.headline,
        summary: session.briefing.summary,
        accuracy: session.briefing.accuracy ?? 0
      };
    }

    const accuracy = session.accuracy ?? 0;
    const logs = Array.isArray(session.answerLogs)
      ? (session.answerLogs as Array<{ correct?: boolean; word?: string }>)
      : [];
    const correctWords = logs
      .filter((item) => item.correct)
      .map((item) => item.word ?? "")
      .filter(Boolean);
    const wrongWords = logs
      .filter((item) => !item.correct)
      .map((item) => item.word ?? "")
      .filter(Boolean);

    const headline = `${session.child.name}本次单词学习正确率 ${accuracy}%`;
    const summary = `完成 ${logs.length} 次作答，答对 ${correctWords.length} 次，答错 ${wrongWords.length} 次。`;

    const briefing = await this.prisma.learningBriefing.create({
      data: {
        learningSessionId: session.id,
        childId: session.childId,
        headline,
        accuracy,
        summary,
        strengths: correctWords,
        weaknesses: wrongWords,
        advice: wrongWords.length > 0 ? "优先复习错词并进行跟读巩固" : "可进入下一组新词学习"
      }
    });

    await this.notificationService.notifyFamilyBriefingReady(
      session.child.familyId,
      session.childId,
      briefing.id,
      briefing.headline
    );

    return {
      briefingId: briefing.id,
      headline: briefing.headline,
      summary: briefing.summary,
      accuracy: briefing.accuracy ?? 0
    };
  }

  async listByChild(
    user: JwtPayload,
    childId: string
  ): Promise<
    Array<{ id: string; headline: string; accuracy: number; summary: string; createdAt: Date }>
  > {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const rows = await this.prisma.learningBriefing.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" }
    });

    return rows.map((item) => ({
      id: item.id,
      headline: item.headline,
      accuracy: item.accuracy ?? 0,
      summary: item.summary,
      createdAt: item.createdAt
    }));
  }
}
