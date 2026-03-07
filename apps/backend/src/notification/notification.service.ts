import { NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyFamilyPendingPush(
    familyId: string,
    childId: string,
    pushId: string,
    summary: string
  ): Promise<void> {
    const parents = await this.prisma.parent.findMany({ where: { familyId } });
    if (parents.length === 0) return;

    await this.prisma.notificationLog.createMany({
      data: parents.map((parent) => ({
        parentId: parent.id,
        childId,
        familyId,
        type: NotificationType.PUSH_PENDING,
        channel: NotificationChannel.IN_APP,
        title: "New learning task pending approval",
        content: summary,
        payload: this.toNullableJsonInput({ pushId })
      }))
    });
  }

  async notifyFamilyPushRejected(
    familyId: string,
    childId: string,
    pushId: string,
    summary: string
  ): Promise<void> {
    const parents = await this.prisma.parent.findMany({ where: { familyId } });
    if (parents.length === 0) return;

    await this.prisma.notificationLog.createMany({
      data: parents.map((parent) => ({
        parentId: parent.id,
        childId,
        familyId,
        type: NotificationType.PUSH_REJECTED,
        channel: NotificationChannel.IN_APP,
        title: "Learning task rejected",
        content: summary,
        payload: this.toNullableJsonInput({ pushId })
      }))
    });
  }

  async notifyChildPushApproved(
    familyId: string,
    childId: string,
    pushId: string,
    summary: string
  ): Promise<void> {
    await this.prisma.notificationLog.create({
      data: {
        familyId,
        childId,
        type: NotificationType.PUSH_APPROVED,
        channel: NotificationChannel.IN_APP,
        title: "Learning task ready",
        content: summary,
        payload: this.toNullableJsonInput({ pushId })
      }
    });
  }

  async notifyFamilyBriefingReady(
    familyId: string,
    childId: string,
    briefingId: string,
    headline: string
  ): Promise<void> {
    const parents = await this.prisma.parent.findMany({ where: { familyId } });
    if (parents.length === 0) return;

    await this.prisma.notificationLog.createMany({
      data: parents.map((parent) => ({
        parentId: parent.id,
        childId,
        familyId,
        type: NotificationType.LEARNING_BRIEFING_READY,
        channel: NotificationChannel.IN_APP,
        title: "Learning briefing is ready",
        content: headline,
        payload: this.toNullableJsonInput({ briefingId })
      }))
    });
  }

  async notifyFamilySystem(
    familyId: string,
    title: string,
    content: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    const parents = await this.prisma.parent.findMany({ where: { familyId } });
    if (parents.length === 0) return;

    await this.prisma.notificationLog.createMany({
      data: parents.map((parent) => ({
        parentId: parent.id,
        familyId,
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.IN_APP,
        title,
        content,
        payload: this.toNullableJsonInput(payload ?? null)
      }))
    });
  }

  async listMyNotifications(user: JwtPayload): Promise<
    Array<{
      id: string;
      type: NotificationType;
      title: string;
      content: string;
      createdAt: Date;
      payload: Record<string, unknown> | null;
    }>
  > {
    const rows = await this.prisma.notificationLog.findMany({
      where: {
        parentId: user.sub,
        familyId: user.familyId
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return rows.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      createdAt: item.createdAt,
      payload: (item.payload ?? null) as Record<string, unknown> | null
    }));
  }

  private toNullableJsonInput(
    input: unknown
  ): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
    if (input === null) {
      return Prisma.JsonNull;
    }
    return input as Prisma.InputJsonValue;
  }
}
