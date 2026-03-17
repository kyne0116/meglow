import assert from "node:assert/strict";
import test from "node:test";
import { buildSummaryNextStep } from "./summary-next-step.ts";

test("buildSummaryNextStep prefers remaining delivered tasks", () => {
  const result = buildSummaryNextStep(
    [
      { id: "task-current", status: "COMPLETED", summary: "done task" },
      { id: "task-next", status: "DELIVERED", summary: "review task" },
      { id: "task-later", status: "APPROVED", summary: "later task" }
    ],
    { currentTaskId: "task-current", needsReviewWordCount: 1 }
  );

  assert.equal(result.actionType, "START_NEXT_TASK");
  assert.equal(result.taskId, "task-next");
  assert.equal(result.pendingPushSummary, "");
  assert.equal(result.nextTaskSummary.includes("review task"), true);
});

test("buildSummaryNextStep falls back to deliverable tasks", () => {
  const result = buildSummaryNextStep(
    [
      { id: "task-current", status: "COMPLETED", summary: "done task" },
      { id: "task-next", status: "APPROVED", summary: "today task" },
      { id: "task-later", status: "MODIFIED", summary: "later task" }
    ],
    { currentTaskId: "task-current", needsReviewWordCount: 0 }
  );

  assert.equal(result.actionType, "DELIVER_AND_START_NEXT_TASK");
  assert.equal(result.taskId, "task-next");
  assert.equal(result.pendingPushSummary, "");
  assert.equal(result.nextTaskSummary.includes("today task"), true);
});

test("buildSummaryNextStep includes matched pending push time when waiting for review approval", () => {
  const result = buildSummaryNextStep([{ id: "task-current", status: "COMPLETED", summary: "done task" }], {
    currentTaskId: "task-current",
    needsReviewWordCount: 2,
    pendingPushSummary: "apple pronunciation review",
    pendingPushScheduledAt: "2026-03-17T10:30:00.000Z"
  });

  assert.equal(result.actionType, "OPEN_TASK_PANEL");
  assert.equal(result.taskId, undefined);
  assert.equal(result.nextTaskSummary, "");
  assert.equal(result.pendingPushSummary.includes("apple pronunciation review"), true);
  assert.equal(result.pendingPushSummary.endsWith("2026-03-17 10:30"), true);
});

test("buildSummaryNextStep keeps a generic fallback when nothing else is queued", () => {
  const result = buildSummaryNextStep([{ id: "task-current", status: "COMPLETED", summary: "done task" }], {
    currentTaskId: "task-current",
    needsReviewWordCount: 0
  });

  assert.equal(result.actionType, "OPEN_TASK_PANEL");
  assert.equal(result.taskId, undefined);
  assert.equal(result.nextTaskSummary, "");
  assert.equal(result.pendingPushSummary, "");
});
