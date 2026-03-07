import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import {
  ApprovalAction,
  ParentApprovalWorkflowRunStatus,
  Prisma,
  PushStatus
} from "@prisma/client";
import { JwtPayload } from "../../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { PushService } from "../../push/push.service";
import { WAIT_PARENT_DECISION_STEP_ID, parentApprovalWorkflow } from "./parent-approval.workflow";
import { ResumeParentApprovalWorkflowDto } from "./dto/resume-parent-approval-workflow.dto";
import { MastraWorkflowRuntimeService } from "./mastra-workflow-runtime.service";
import { ConfigService } from "@nestjs/config";

type ParentApprovalRun = Awaited<ReturnType<typeof parentApprovalWorkflow.createRun>>;
type WorkflowExecutionResult = Awaited<ReturnType<ParentApprovalRun["start"]>>;

interface ApprovalRunRecord {
  runId: string;
  workflowId: string;
  familyId: string;
  childId: string;
  pushId: string;
  status: ParentApprovalWorkflowRunStatus;
  suspendPayload: Prisma.JsonValue | null;
  resumeLabels: Prisma.JsonValue | null;
  lastError: string | null;
}

interface WorkflowExecutionView {
  runId: string;
  pushId: string;
  workflowStatus: string;
  suspendPayload?: Record<string, unknown>;
  resumeLabels?: Record<string, { stepId: string; forEachIndex?: number }>;
  result?: Record<string, unknown>;
  error?: string;
  appliedPushStatus?: PushStatus;
}

@Injectable()
export class ParentApprovalWorkflowService {
  private readonly logger = new Logger(ParentApprovalWorkflowService.name);
  private static readonly inMemoryRuns = new Map<string, ParentApprovalRun>();

  private get runStore(): Map<string, ParentApprovalRun> {
    return ParentApprovalWorkflowService.inMemoryRuns;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
    private readonly workflowRuntime: MastraWorkflowRuntimeService,
    private readonly configService: ConfigService
  ) {}

  async startForPendingPush(user: JwtPayload, pushId: string): Promise<WorkflowExecutionView> {
    const push = await this.prisma.learningPush.findFirst({
      where: {
        id: pushId,
        status: PushStatus.PENDING_APPROVAL,
        child: { familyId: user.familyId }
      }
    });
    if (!push) {
      throw new NotFoundException("pending push not found");
    }

    const existing = await this.findActiveRunByPushId(push.id);
    if (existing) {
      return this.getCurrentExecutionView(existing);
    }

    return this.startWorkflowForPush({
      familyId: user.familyId,
      pushId: push.id,
      childId: push.childId,
      summary: push.summary,
      reason: push.reason,
      expectedOutcome: push.expectedOutcome,
      content: this.normalizeObject(push.content)
    });
  }

  async runAutoStartForFamily(user: JwtPayload): Promise<{ started: number; skipped: number }> {
    return this.runAutoStartForFamilyId(user.familyId);
  }

  async runAutoStartForFamilyId(familyId: string): Promise<{ started: number; skipped: number }> {
    const pendingPushes = await this.prisma.learningPush.findMany({
      where: {
        status: PushStatus.PENDING_APPROVAL,
        child: { familyId }
      },
      select: {
        id: true,
        childId: true,
        summary: true,
        reason: true,
        expectedOutcome: true,
        content: true
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }]
    });

    let started = 0;
    let skipped = 0;

    for (const push of pendingPushes) {
      const existing = await this.findActiveRunByPushId(push.id);
      if (existing) {
        skipped += 1;
        continue;
      }

      const result = await this.startWorkflowForPush({
        familyId,
        pushId: push.id,
        childId: push.childId,
        summary: push.summary,
        reason: push.reason,
        expectedOutcome: push.expectedOutcome,
        content: this.normalizeObject(push.content)
      });
      if (result.workflowStatus === "suspended" || result.workflowStatus === "success") {
        started += 1;
      } else {
        skipped += 1;
      }
    }

    return { started, skipped };
  }

  @Cron("*/1 * * * *")
  async autoStartPendingApprovals(): Promise<void> {
    const families = await this.prisma.family.findMany({
      select: { id: true }
    });

    let started = 0;
    let skipped = 0;
    for (const family of families) {
      const result = await this.runAutoStartForFamilyId(family.id);
      started += result.started;
      skipped += result.skipped;
    }

    if (families.length > 0) {
      this.logger.log(
        `approval workflow auto-start completed: families=${families.length} started=${started} skipped=${skipped}`
      );
    }
  }

  clearInMemoryRunStoreForTest(): void {
    if (process.env.NODE_ENV !== "test") {
      return;
    }
    this.runStore.clear();
    this.workflowRuntime.getWorkflow().runs.clear();
  }

  private async startWorkflowForPush(params: {
    familyId: string;
    pushId: string;
    childId: string;
    summary: string;
    reason: string;
    expectedOutcome: string;
    content: Record<string, unknown>;
  }): Promise<WorkflowExecutionView> {
    this.ensureDurableReady("start");

    const workflow = this.workflowRuntime.getWorkflow();
    const run = await workflow.createRun({
      resourceId: params.childId
    });
    this.runStore.set(run.runId, run);

    await this.prisma.parentApprovalWorkflowRun.upsert({
      where: { pushId: params.pushId },
      create: {
        runId: run.runId,
        workflowId: workflow.id,
        familyId: params.familyId,
        childId: params.childId,
        pushId: params.pushId,
        status: ParentApprovalWorkflowRunStatus.RUNNING,
        startedAt: new Date()
      },
      update: {
        runId: run.runId,
        workflowId: workflow.id,
        familyId: params.familyId,
        childId: params.childId,
        status: ParentApprovalWorkflowRunStatus.RUNNING,
        suspendPayload: Prisma.DbNull,
        resumeLabels: Prisma.DbNull,
        lastError: null,
        startedAt: new Date(),
        suspendedAt: null,
        completedAt: null
      }
    });

    const result = await run.start({
      inputData: {
        pushId: params.pushId,
        childId: params.childId,
        summary: params.summary,
        reason: params.reason,
        expectedOutcome: params.expectedOutcome,
        content: params.content
      }
    });
    await this.updateRunRecordState(run.runId, result);
    this.releaseRunIfFinished(run.runId, result);

    return this.toExecutionView(run.runId, params.pushId, result);
  }

  async resumeWithParentAction(
    user: JwtPayload,
    runId: string,
    dto: ResumeParentApprovalWorkflowDto
  ): Promise<WorkflowExecutionView> {
    const runRecord = await this.prisma.parentApprovalWorkflowRun.findUnique({
      where: { runId },
      select: this.approvalRunSelect
    });
    if (!runRecord) {
      throw new NotFoundException("workflow run not found");
    }
    if (runRecord.familyId !== user.familyId) {
      throw new ForbiddenException("permission denied");
    }
    if (!this.isResumableStatus(runRecord.status)) {
      return this.getCurrentExecutionView(runRecord);
    }

    this.ensureDurableReady("resume");

    const run = await this.getRunHandle(runRecord);
    if (!run) {
      if (this.isDurableRequired()) {
        throw new ServiceUnavailableException("workflow durable snapshot unavailable");
      }
      this.logger.warn(
        `fallback apply: runtime missing runId=${runRecord.runId} pushId=${runRecord.pushId}`
      );
      return this.applyDecisionWithoutRuntime(user, runRecord, dto);
    }

    let result: WorkflowExecutionResult;
    try {
      result = await run.resume({
        step: WAIT_PARENT_DECISION_STEP_ID,
        resumeData: {
          action: dto.action as ApprovalAction,
          comment: dto.comment,
          modifiedContent: dto.modifiedContent,
          postponedUntil: dto.postponedUntil
        }
      });
    } catch (error: unknown) {
      const message = this.normalizeErrorMessage(error);
      if (message.includes("No snapshot found for this workflow run")) {
        if (this.isDurableRequired()) {
          throw new ServiceUnavailableException("workflow durable snapshot unavailable");
        }
        this.logger.warn(
          `fallback apply: snapshot missing runId=${runRecord.runId} pushId=${runRecord.pushId} reason=${message}`
        );
        return this.applyDecisionWithoutRuntime(user, runRecord, dto);
      }
      throw error;
    }

    let appliedPushStatus: PushStatus | undefined;
    if (result.status === "success") {
      try {
        const applied = await this.pushService.approvePush(user, runRecord.pushId, {
          action: dto.action as ApprovalAction,
          comment: dto.comment,
          modifiedContent: dto.modifiedContent,
          postponedUntil: dto.postponedUntil
        });
        appliedPushStatus = applied.status;
      } catch (error: unknown) {
        await this.prisma.parentApprovalWorkflowRun.update({
          where: { runId: runRecord.runId },
          data: {
            status: ParentApprovalWorkflowRunStatus.FAILED,
            completedAt: new Date(),
            lastError: this.normalizeErrorMessage(error)
          }
        });
        this.runStore.delete(runRecord.runId);
        throw error;
      }
    }

    await this.updateRunRecordState(runRecord.runId, result);
    this.releaseRunIfFinished(runRecord.runId, result);

    return {
      ...this.toExecutionView(runRecord.runId, runRecord.pushId, result),
      appliedPushStatus
    };
  }

  private async findActiveRunByPushId(pushId: string): Promise<ApprovalRunRecord | null> {
    return this.prisma.parentApprovalWorkflowRun.findFirst({
      where: {
        pushId,
        status: {
          in: [ParentApprovalWorkflowRunStatus.RUNNING, ParentApprovalWorkflowRunStatus.SUSPENDED]
        }
      },
      select: this.approvalRunSelect
    });
  }

  private readonly approvalRunSelect = {
    runId: true,
    workflowId: true,
    familyId: true,
    childId: true,
    pushId: true,
    status: true,
    suspendPayload: true,
    resumeLabels: true,
    lastError: true
  } satisfies Prisma.ParentApprovalWorkflowRunSelect;

  private async getCurrentExecutionView(
    runRecord: ApprovalRunRecord
  ): Promise<WorkflowExecutionView> {
    const workflow = this.workflowRuntime.getWorkflow();
    const workflowRun = await workflow.getWorkflowRunById(runRecord.runId, {
      withNestedWorkflows: false
    });
    if (!workflowRun) {
      return this.toExecutionViewFromRecord(runRecord);
    }

    if (workflowRun.status === "suspended") {
      return {
        runId: runRecord.runId,
        pushId: runRecord.pushId,
        workflowStatus: workflowRun.status,
        suspendPayload: this.normalizeOptionalObject(runRecord.suspendPayload),
        resumeLabels: this.normalizeResumeLabels(runRecord.resumeLabels)
      };
    }

    if (workflowRun.status === "success") {
      return {
        runId: runRecord.runId,
        pushId: runRecord.pushId,
        workflowStatus: workflowRun.status,
        result: this.normalizeObject(workflowRun.result)
      };
    }

    if (
      workflowRun.status === "failed" ||
      workflowRun.status === "tripwire" ||
      workflowRun.status === "canceled"
    ) {
      return {
        runId: runRecord.runId,
        pushId: runRecord.pushId,
        workflowStatus: workflowRun.status,
        error: this.normalizeErrorMessage(workflowRun.error)
      };
    }

    return {
      runId: runRecord.runId,
      pushId: runRecord.pushId,
      workflowStatus: workflowRun.status,
      result: this.normalizeObject(workflowRun.payload)
    };
  }

  private async getRunHandle(runRecord: ApprovalRunRecord): Promise<ParentApprovalRun | null> {
    const cached = this.runStore.get(runRecord.runId);
    if (cached) {
      return cached;
    }

    const workflow = this.workflowRuntime.getWorkflow();
    const workflowRun = await workflow.getWorkflowRunById(runRecord.runId, {
      withNestedWorkflows: false
    });
    if (!workflowRun) {
      return null;
    }
    if (workflowRun.isFromInMemory) {
      return null;
    }

    const run = await workflow.createRun({
      runId: runRecord.runId,
      resourceId: runRecord.childId
    });
    this.runStore.set(runRecord.runId, run);
    return run;
  }

  private async applyDecisionWithoutRuntime(
    user: JwtPayload,
    runRecord: ApprovalRunRecord,
    dto: ResumeParentApprovalWorkflowDto
  ): Promise<WorkflowExecutionView> {
    const applied = await this.pushService.approvePush(user, runRecord.pushId, {
      action: dto.action as ApprovalAction,
      comment: dto.comment,
      modifiedContent: dto.modifiedContent,
      postponedUntil: dto.postponedUntil
    });

    await this.prisma.parentApprovalWorkflowRun.update({
      where: { runId: runRecord.runId },
      data: {
        status: ParentApprovalWorkflowRunStatus.SUCCESS,
        completedAt: new Date(),
        suspendPayload: Prisma.DbNull,
        resumeLabels: Prisma.DbNull,
        lastError: null
      }
    });
    this.runStore.delete(runRecord.runId);

    return {
      runId: runRecord.runId,
      pushId: runRecord.pushId,
      workflowStatus: "success",
      result: {
        pushId: runRecord.pushId,
        action: dto.action,
        nextStatus: applied.status
      },
      appliedPushStatus: applied.status
    };
  }

  private ensureDurableReady(phase: "start" | "resume"): void {
    if (!this.isDurableRequired()) {
      return;
    }
    if (!this.workflowRuntime.isDurableEnabled()) {
      throw new ServiceUnavailableException(`workflow durable storage unavailable during ${phase}`);
    }
  }

  private isDurableRequired(): boolean {
    const raw = (
      this.configService.get<string>("MASTRA_DURABLE_REQUIRED") ?? "false"
    ).toLowerCase();
    return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
  }

  private toExecutionViewFromRecord(runRecord: ApprovalRunRecord): WorkflowExecutionView {
    const workflowStatus = this.mapRunStatusToWorkflowStatus(runRecord.status);
    if (workflowStatus === "suspended") {
      return {
        runId: runRecord.runId,
        pushId: runRecord.pushId,
        workflowStatus,
        suspendPayload: this.normalizeOptionalObject(runRecord.suspendPayload),
        resumeLabels: this.normalizeResumeLabels(runRecord.resumeLabels)
      };
    }

    if (
      workflowStatus === "failed" ||
      workflowStatus === "tripwire" ||
      workflowStatus === "canceled"
    ) {
      return {
        runId: runRecord.runId,
        pushId: runRecord.pushId,
        workflowStatus,
        error: runRecord.lastError ?? "workflow execution failed"
      };
    }

    return {
      runId: runRecord.runId,
      pushId: runRecord.pushId,
      workflowStatus
    };
  }

  private async updateRunRecordState(
    runId: string,
    result: WorkflowExecutionResult
  ): Promise<void> {
    const status = result.status;
    const data: Prisma.ParentApprovalWorkflowRunUpdateInput = {
      status: this.mapWorkflowStatusToRunStatus(status)
    };

    if (status === "suspended") {
      data.suspendPayload = this.toNullableJsonInput(this.normalizeObject(result.suspendPayload));
      data.resumeLabels = this.toNullableJsonInput(this.normalizeResumeLabels(result.resumeLabels));
      data.lastError = null;
      data.suspendedAt = new Date();
      data.completedAt = null;
    } else if (status === "success") {
      data.suspendPayload = Prisma.DbNull;
      data.resumeLabels = Prisma.DbNull;
      data.lastError = null;
      data.completedAt = new Date();
    } else if (status === "failed" || status === "tripwire") {
      data.suspendPayload = Prisma.DbNull;
      data.resumeLabels = Prisma.DbNull;
      data.lastError =
        status === "failed"
          ? this.normalizeErrorMessage(result.error)
          : this.normalizeErrorMessage(result.tripwire?.reason);
      data.completedAt = new Date();
    }

    await this.prisma.parentApprovalWorkflowRun.update({
      where: { runId },
      data
    });
  }

  private releaseRunIfFinished(runId: string, result: WorkflowExecutionResult): void {
    if (this.isFinalStatus(result.status)) {
      this.runStore.delete(runId);
    }
  }

  private isResumableStatus(status: ParentApprovalWorkflowRunStatus): boolean {
    return (
      status === ParentApprovalWorkflowRunStatus.RUNNING ||
      status === ParentApprovalWorkflowRunStatus.SUSPENDED
    );
  }

  private isFinalStatus(status: string): boolean {
    return (
      status === "success" || status === "failed" || status === "tripwire" || status === "canceled"
    );
  }

  private mapWorkflowStatusToRunStatus(status: string): ParentApprovalWorkflowRunStatus {
    if (status === "suspended") {
      return ParentApprovalWorkflowRunStatus.SUSPENDED;
    }
    if (status === "success") {
      return ParentApprovalWorkflowRunStatus.SUCCESS;
    }
    if (status === "failed") {
      return ParentApprovalWorkflowRunStatus.FAILED;
    }
    if (status === "tripwire") {
      return ParentApprovalWorkflowRunStatus.TRIPWIRE;
    }
    if (status === "canceled") {
      return ParentApprovalWorkflowRunStatus.CANCELED;
    }
    return ParentApprovalWorkflowRunStatus.RUNNING;
  }

  private mapRunStatusToWorkflowStatus(status: ParentApprovalWorkflowRunStatus): string {
    if (status === ParentApprovalWorkflowRunStatus.SUSPENDED) {
      return "suspended";
    }
    if (status === ParentApprovalWorkflowRunStatus.SUCCESS) {
      return "success";
    }
    if (status === ParentApprovalWorkflowRunStatus.FAILED) {
      return "failed";
    }
    if (status === ParentApprovalWorkflowRunStatus.TRIPWIRE) {
      return "tripwire";
    }
    if (status === ParentApprovalWorkflowRunStatus.CANCELED) {
      return "canceled";
    }
    return "running";
  }

  private toExecutionView(
    runId: string,
    pushId: string,
    result: Record<string, unknown>
  ): WorkflowExecutionView {
    const status = typeof result.status === "string" ? result.status : "unknown";

    if (status === "suspended") {
      return {
        runId,
        pushId,
        workflowStatus: status,
        suspendPayload: this.normalizeOptionalObject(result.suspendPayload),
        resumeLabels: this.normalizeResumeLabels(result.resumeLabels)
      };
    }

    if (status === "success") {
      return {
        runId,
        pushId,
        workflowStatus: status,
        result: this.normalizeObject(result.result)
      };
    }

    if (status === "failed") {
      const message = this.normalizeErrorMessage(result.error);
      return {
        runId,
        pushId,
        workflowStatus: status,
        error: message
      };
    }

    return {
      runId,
      pushId,
      workflowStatus: status,
      result: this.normalizeObject(result)
    };
  }

  private normalizeOptionalObject(input: unknown): Record<string, unknown> | undefined {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return undefined;
    }
    return input as Record<string, unknown>;
  }

  private normalizeObject(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return {};
    }
    return input as Record<string, unknown>;
  }

  private toNullableJsonInput(
    value: unknown
  ): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
    if (value === null || value === undefined) {
      return Prisma.DbNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private normalizeErrorMessage(input: unknown): string {
    if (!input) {
      return "workflow execution failed";
    }
    if (input instanceof Error) {
      return input.message;
    }
    if (typeof input === "object") {
      const message = (input as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }
    return String(input);
  }

  private normalizeResumeLabels(
    input: unknown
  ): Record<string, { stepId: string; forEachIndex?: number }> | undefined {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return undefined;
    }
    const labels: Record<string, { stepId: string; forEachIndex?: number }> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        continue;
      }
      const candidate = value as { stepId?: unknown; forEachIndex?: unknown };
      if (typeof candidate.stepId !== "string") {
        continue;
      }
      labels[key] = {
        stepId: candidate.stepId,
        forEachIndex:
          typeof candidate.forEachIndex === "number" ? candidate.forEachIndex : undefined
      };
    }
    return labels;
  }
}
