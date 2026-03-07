import { LearningSessionStatus, LearningType, Prisma } from "@prisma/client";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AiTutorService } from "../ai/ai-tutor.service";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";
import { StartScenarioSessionDto } from "./dto/start-scenario-session.dto";
import { SubmitScenarioInputDto } from "./dto/submit-scenario-input.dto";

@Injectable()
export class ScenarioSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiTutorService: AiTutorService
  ) {}

  async start(
    user: JwtPayload,
    type: LearningType,
    dto: StartScenarioSessionDto
  ): Promise<{
    sessionId: string;
    type: LearningType;
    status: LearningSessionStatus;
    startedAt: Date;
  }> {
    const child = await this.prisma.child.findFirst({
      where: { id: dto.childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const session = await this.prisma.learningSession.create({
      data: {
        childId: dto.childId,
        type,
        status: LearningSessionStatus.IN_PROGRESS,
        payload: {
          topic: dto.topic ?? "",
          extra: (dto.payload ?? {}) as Prisma.InputJsonValue
        } as Prisma.InputJsonValue,
        answerLogs: []
      }
    });

    return {
      sessionId: session.id,
      type: session.type,
      status: session.status,
      startedAt: session.startedAt
    };
  }

  async submit(
    user: JwtPayload,
    type: LearningType,
    sessionId: string,
    dto: SubmitScenarioInputDto
  ): Promise<{
    sessionId: string;
    inputs: number;
    score: number;
    feedback: string;
    correction: string;
    nextAction: string;
  }> {
    const session = await this.prisma.learningSession.findFirst({
      where: {
        id: sessionId,
        type,
        status: LearningSessionStatus.IN_PROGRESS,
        child: { familyId: user.familyId }
      },
      include: {
        child: true
      }
    });
    if (!session) {
      throw new NotFoundException("session not found");
    }

    const payload = (session.payload ?? {}) as { topic?: string };
    const aiResult = await this.aiTutorService.evaluateScenario({
      type,
      topic: payload.topic ?? "",
      userInput: dto.input,
      grade: session.child.grade
    });

    const score = dto.score ?? aiResult.score;
    const feedback = dto.feedback ?? aiResult.feedback;
    const logs = Array.isArray(session.answerLogs) ? [...(session.answerLogs as object[])] : [];
    logs.push({
      input: dto.input,
      score,
      feedback,
      correction: aiResult.correction,
      encouragement: aiResult.encouragement,
      nextAction: aiResult.nextAction,
      at: new Date().toISOString()
    });

    await this.prisma.learningSession.update({
      where: { id: session.id },
      data: { answerLogs: logs }
    });

    return {
      sessionId: session.id,
      inputs: logs.length,
      score,
      feedback,
      correction: aiResult.correction,
      nextAction: aiResult.nextAction
    };
  }

  async end(
    user: JwtPayload,
    type: LearningType,
    sessionId: string
  ): Promise<{
    sessionId: string;
    type: LearningType;
    status: LearningSessionStatus;
    averageScore: number;
    durationSec: number;
  }> {
    const session = await this.prisma.learningSession.findFirst({
      where: {
        id: sessionId,
        type,
        status: LearningSessionStatus.IN_PROGRESS,
        child: { familyId: user.familyId }
      }
    });
    if (!session) {
      throw new NotFoundException("session not found");
    }

    const logs = Array.isArray(session.answerLogs)
      ? (session.answerLogs as Array<{ score?: number }>)
      : [];
    const scored = logs.filter((item) => typeof item.score === "number");
    const averageScore =
      scored.length === 0
        ? 0
        : Number(
            (scored.reduce((sum, item) => sum + (item.score ?? 0), 0) / scored.length).toFixed(2)
          );
    const completedAt = new Date();
    const durationSec = Math.max(
      1,
      Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
    );

    const updated = await this.prisma.learningSession.update({
      where: { id: session.id },
      data: {
        status: LearningSessionStatus.COMPLETED,
        completedAt,
        accuracy: averageScore,
        durationSec
      }
    });

    return {
      sessionId: updated.id,
      type: updated.type,
      status: updated.status,
      averageScore,
      durationSec: updated.durationSec ?? 0
    };
  }

  async progress(
    user: JwtPayload,
    type: LearningType,
    childId: string
  ): Promise<{
    childId: string;
    type: LearningType;
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
  }> {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, familyId: user.familyId }
    });
    if (!child) {
      throw new NotFoundException("child not found");
    }

    const sessions = await this.prisma.learningSession.findMany({
      where: { childId, type }
    });

    const totalSessions = sessions.length;
    const completed = sessions.filter((item) => item.status === LearningSessionStatus.COMPLETED);
    const completedSessions = completed.length;
    const averageScore =
      completedSessions === 0
        ? 0
        : Number(
            (
              completed.reduce((sum, item) => sum + (item.accuracy ?? 0), 0) / completedSessions
            ).toFixed(2)
          );

    return {
      childId,
      type,
      totalSessions,
      completedSessions,
      averageScore
    };
  }
}
