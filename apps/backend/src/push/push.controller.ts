import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { PushStatus } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { ApprovePushDto } from "./dto/approve-push.dto";
import { CreatePushDto } from "./dto/create-push.dto";
import { PushService } from "./push.service";

@UseGuards(JwtAuthGuard)
@Controller("pushes")
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post()
  async createPush(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePushDto
  ): Promise<{ pushId: string; status: PushStatus }> {
    return this.pushService.createPush(user, dto);
  }

  @Get("pending")
  async getPending(@CurrentUser() user: JwtPayload): Promise<
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
    return this.pushService.getPendingPushes(user);
  }

  @Post(":pushId/approve")
  async approvePush(
    @CurrentUser() user: JwtPayload,
    @Param("pushId") pushId: string,
    @Body() dto: ApprovePushDto
  ): Promise<{ pushId: string; status: PushStatus }> {
    return this.pushService.approvePush(user, pushId, dto);
  }

  @Post(":pushId/deliver")
  async deliverPush(
    @CurrentUser() user: JwtPayload,
    @Param("pushId") pushId: string
  ): Promise<{ pushId: string; status: PushStatus }> {
    return this.pushService.deliverPush(user, pushId);
  }

  @Post(":pushId/complete")
  async completePush(
    @CurrentUser() user: JwtPayload,
    @Param("pushId") pushId: string
  ): Promise<{ pushId: string; status: PushStatus }> {
    return this.pushService.completePush(user, pushId);
  }

  @Get("history/:childId")
  async getPushHistory(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string
  ): Promise<
    Array<{ id: string; status: PushStatus; summary: string; scheduledAt: Date; createdAt: Date }>
  > {
    return this.pushService.getPushHistory(user, childId);
  }

  @Get("tasks/:childId")
  async getChildTasks(
    @CurrentUser() user: JwtPayload,
    @Param("childId") childId: string,
    @Query("date") date?: string
  ): Promise<
    Array<{
      id: string;
      summary: string;
      status: PushStatus;
      scheduledAt: Date;
      content: Record<string, unknown>;
    }>
  > {
    return this.pushService.getChildTasks(user, childId, date);
  }

  @Post("scheduler/run")
  async runScheduler(
    @CurrentUser() user: JwtPayload
  ): Promise<{ created: number; skipped: number }> {
    return this.pushService.runSchedulerForFamily(user);
  }

  @Post("delivery/run")
  async runDelivery(
    @CurrentUser() user: JwtPayload
  ): Promise<{ delivered: number; skipped: number }> {
    return this.pushService.runAutoDeliveryForFamily(user);
  }

  @Post("postponed/requeue/run")
  async runPostponedRequeue(
    @CurrentUser() user: JwtPayload
  ): Promise<{ requeued: number; skipped: number }> {
    return this.pushService.runPostponedRequeueForFamily(user);
  }

  @Post("expiration/run")
  async runExpiration(
    @CurrentUser() user: JwtPayload
  ): Promise<{ expired: number; skipped: number }> {
    return this.pushService.runExpirationForFamily(user);
  }
}
