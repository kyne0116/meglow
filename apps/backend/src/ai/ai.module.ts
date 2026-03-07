import { Module } from "@nestjs/common";
import { AiTutorService } from "./ai-tutor.service";
import { AiEvalController } from "./evals/ai-eval.controller";
import { AiEvalService } from "./evals/ai-eval.service";
import { LlmGatewayService } from "./llm-gateway.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PushModule } from "../push/push.module";
import { ParentApprovalWorkflowController } from "./workflows/parent-approval-workflow.controller";
import { ParentApprovalWorkflowService } from "./workflows/parent-approval-workflow.service";
import { MastraWorkflowRuntimeService } from "./workflows/mastra-workflow-runtime.service";

@Module({
  imports: [PrismaModule, PushModule],
  controllers: [AiEvalController, ParentApprovalWorkflowController],
  providers: [
    AiTutorService,
    AiEvalService,
    LlmGatewayService,
    MastraWorkflowRuntimeService,
    ParentApprovalWorkflowService
  ],
  exports: [AiTutorService]
})
export class AiModule {}
