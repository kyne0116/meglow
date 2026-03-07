import { Controller, Get, UseGuards } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { NotificationService } from "./notification.service";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get("me")
  async listMine(@CurrentUser() user: JwtPayload): Promise<
    Array<{
      id: string;
      type: NotificationType;
      title: string;
      content: string;
      createdAt: Date;
      payload: Record<string, unknown> | null;
    }>
  > {
    return this.notificationService.listMyNotifications(user);
  }
}
