import { Controller, Param, Post, Body, UseGuards } from "@nestjs/common";
import { PushStatus } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { JwtPayload } from "../../auth/interfaces/jwt-payload.interface";
import { ResumeParentApprovalWorkflowDto } from "./dto/resume-parent-approval-workflow.dto";
import { ParentApprovalWorkflowService } from "./parent-approval-workflow.service";

@UseGuards(JwtAuthGuard)
@Controller("ai/workflows/approval")
export class ParentApprovalWorkflowController {
  constructor(private readonly parentApprovalWorkflowService: ParentApprovalWorkflowService) {}

  @Post("auto-start/run")
  async runAutoStartForFamily(@CurrentUser() user: JwtPayload): Promise<{
    started: number;
    skipped: number;
  }> {
    return this.parentApprovalWorkflowService.runAutoStartForFamily(user);
  }

  @Post("start/:pushId")
  async startForPendingPush(
    @CurrentUser() user: JwtPayload,
    @Param("pushId") pushId: string
  ): Promise<{
    runId: string;
    pushId: string;
    workflowStatus: string;
    suspendPayload?: Record<string, unknown>;
    resumeLabels?: Record<string, { stepId: string; forEachIndex?: number }>;
    result?: Record<string, unknown>;
    error?: string;
    appliedPushStatus?: PushStatus;
  }> {
    return this.parentApprovalWorkflowService.startForPendingPush(user, pushId);
  }

  @Post("resume/:runId")
  async resumeWithParentAction(
    @CurrentUser() user: JwtPayload,
    @Param("runId") runId: string,
    @Body() dto: ResumeParentApprovalWorkflowDto
  ): Promise<{
    runId: string;
    pushId: string;
    workflowStatus: string;
    suspendPayload?: Record<string, unknown>;
    resumeLabels?: Record<string, { stepId: string; forEachIndex?: number }>;
    result?: Record<string, unknown>;
    error?: string;
    appliedPushStatus?: PushStatus;
  }> {
    return this.parentApprovalWorkflowService.resumeWithParentAction(user, runId, dto);
  }
}
