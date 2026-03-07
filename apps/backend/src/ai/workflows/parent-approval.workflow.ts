import { PushStatus } from "@prisma/client";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const approvalActionSchema = z.enum(["APPROVE", "REJECT", "MODIFY", "POSTPONE"]);

export const WAIT_PARENT_DECISION_STEP_ID = "wait_parent_decision";

export const parentApprovalWorkflowInputSchema = z.object({
  pushId: z.string(),
  childId: z.string(),
  summary: z.string(),
  reason: z.string(),
  expectedOutcome: z.string(),
  content: z.record(z.string(), z.unknown())
});

const preparedPushSchema = z.object({
  pushId: z.string(),
  childId: z.string(),
  summary: z.string(),
  reason: z.string(),
  expectedOutcome: z.string(),
  content: z.record(z.string(), z.unknown()),
  generatedAt: z.string()
});

const approvalSuspendPayloadSchema = z.object({
  type: z.literal("PARENT_APPROVAL_REQUIRED"),
  pushId: z.string(),
  childId: z.string(),
  summary: z.string(),
  reason: z.string(),
  expectedOutcome: z.string(),
  suggestedActions: z.array(approvalActionSchema)
});

const parentDecisionSchema = z.object({
  action: approvalActionSchema,
  comment: z.string().optional(),
  modifiedContent: z.record(z.string(), z.unknown()).optional(),
  postponedUntil: z.string().datetime().optional()
});

const approvalDecisionSchema = z.object({
  pushId: z.string(),
  childId: z.string(),
  summary: z.string(),
  reason: z.string(),
  expectedOutcome: z.string(),
  content: z.record(z.string(), z.unknown()),
  generatedAt: z.string(),
  decision: parentDecisionSchema
});

const parentApprovalWorkflowOutputSchema = z.object({
  pushId: z.string(),
  action: approvalActionSchema,
  nextStatus: z.nativeEnum(PushStatus),
  summary: z.string(),
  decisionComment: z.string().optional()
});

const preparePushStep = createStep({
  id: "prepare_push_context",
  inputSchema: parentApprovalWorkflowInputSchema,
  outputSchema: preparedPushSchema,
  execute: async ({ inputData }) => {
    return {
      ...inputData,
      generatedAt: new Date().toISOString()
    };
  }
});

const waitParentDecisionStep = createStep({
  id: WAIT_PARENT_DECISION_STEP_ID,
  inputSchema: preparedPushSchema,
  outputSchema: approvalDecisionSchema,
  suspendSchema: approvalSuspendPayloadSchema,
  resumeSchema: parentDecisionSchema,
  execute: async ({ inputData, suspend, resumeData }) => {
    if (!resumeData) {
      return suspend(
        {
          type: "PARENT_APPROVAL_REQUIRED",
          pushId: inputData.pushId,
          childId: inputData.childId,
          summary: inputData.summary,
          reason: inputData.reason,
          expectedOutcome: inputData.expectedOutcome,
          suggestedActions: ["APPROVE", "REJECT", "MODIFY", "POSTPONE"]
        },
        { resumeLabel: [`push:${inputData.pushId}`] }
      );
    }

    return {
      ...inputData,
      decision: resumeData
    };
  }
});

const finalizePushStep = createStep({
  id: "finalize_approval_result",
  inputSchema: approvalDecisionSchema,
  outputSchema: parentApprovalWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    const nextStatus = mapActionToPushStatus(inputData.decision.action);
    return {
      pushId: inputData.pushId,
      action: inputData.decision.action,
      nextStatus,
      summary: inputData.summary,
      decisionComment: inputData.decision.comment
    };
  }
});

export const parentApprovalWorkflow = createWorkflow({
  id: "parent_approval_workflow",
  description: "Approval workflow with suspend/resume for parent-in-the-loop push decisions.",
  inputSchema: parentApprovalWorkflowInputSchema,
  outputSchema: parentApprovalWorkflowOutputSchema
})
  .then(preparePushStep)
  .then(waitParentDecisionStep)
  .then(finalizePushStep)
  .commit();

function mapActionToPushStatus(action: z.infer<typeof approvalActionSchema>): PushStatus {
  if (action === "APPROVE") {
    return PushStatus.APPROVED;
  }
  if (action === "REJECT") {
    return PushStatus.REJECTED;
  }
  if (action === "MODIFY") {
    return PushStatus.MODIFIED;
  }
  return PushStatus.POSTPONED;
}
