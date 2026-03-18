import assert from "node:assert/strict";
import test from "node:test";
import { buildSummaryNextStep } from "./summary-next-step.ts";

test("buildSummaryNextStep prefers remaining delivered tasks and includes next task schedule and insight", () => {
  const result = buildSummaryNextStep(
    [
      {
        id: "task-current",
        status: "COMPLETED",
        summary: "done task",
        scheduledAt: "2026-03-17T07:00:00.000Z",
        content: {}
      },
      {
        id: "task-next",
        status: "DELIVERED",
        summary: "review task",
        scheduledAt: "2026-03-17T09:30:00.000Z",
        content: {
          mode: "word_review",
          priority: "high",
          dueWords: 2,
          newWords: 1
        }
      },
      {
        id: "task-later",
        status: "APPROVED",
        summary: "later task",
        scheduledAt: "2026-03-17T10:00:00.000Z",
        content: {}
      }
    ],
    { currentTaskId: "task-current", needsReviewWordCount: 1 }
  );

  assert.equal(result.actionType, "START_NEXT_TASK");
  assert.equal(result.taskId, "task-next");
  assert.equal(result.pendingPushSummary, "");
  assert.equal(result.nextTaskSummary.includes("review task"), true);
  assert.equal(result.nextTaskSummary.includes("2026-03-17 17:30"), true);
  assert.equal(result.nextTaskInsight, "英语单词任务 · 高优先级 · 复习 2 个，新增 1 个");
  assert.equal(result.nextTaskCoachHint, "");
});

test("buildSummaryNextStep falls back to deliverable tasks and includes next task insight", () => {
  const result = buildSummaryNextStep(
    [
      {
        id: "task-current",
        status: "COMPLETED",
        summary: "done task",
        scheduledAt: "2026-03-17T07:00:00.000Z",
        content: {}
      },
      {
        id: "task-next",
        status: "APPROVED",
        summary: "today task",
        scheduledAt: "2026-03-17T10:30:00.000Z",
        content: {
          mode: "word_learning",
          dueWords: 3,
          newWords: 2,
          coachHint: "finish review words before new words"
        }
      },
      {
        id: "task-later",
        status: "MODIFIED",
        summary: "later task",
        scheduledAt: "2026-03-17T11:00:00.000Z",
        content: {}
      }
    ],
    { currentTaskId: "task-current", needsReviewWordCount: 0 }
  );

  assert.equal(result.actionType, "DELIVER_AND_START_NEXT_TASK");
  assert.equal(result.taskId, "task-next");
  assert.equal(result.pendingPushSummary, "");
  assert.equal(result.nextTaskSummary.includes("today task"), true);
  assert.equal(result.nextTaskSummary.includes("2026-03-17 18:30"), true);
  assert.equal(result.nextTaskInsight, "英语单词任务 · 常规 · 复习 3 个，新增 2 个");
  assert.equal(result.nextTaskCoachHint, "finish review words before new words");
});

test("buildSummaryNextStep includes matched pending push time when waiting for review approval", () => {
  const result = buildSummaryNextStep(
    [
      {
        id: "task-current",
        status: "COMPLETED",
        summary: "done task",
        scheduledAt: "2026-03-17T07:00:00.000Z",
        content: {}
      }
    ],
    {
      currentTaskId: "task-current",
      needsReviewWordCount: 2,
      pendingPushSummary: "apple pronunciation review",
      pendingPushScheduledAt: "2026-03-17T10:30:00.000Z"
    }
  );

  assert.equal(result.actionType, "OPEN_TASK_PANEL");
  assert.equal(result.taskId, undefined);
  assert.equal(result.nextTaskSummary, "");
  assert.equal(result.nextTaskInsight, "");
  assert.equal(result.nextTaskCoachHint, "");
  assert.equal(result.pendingPushSummary.includes("apple pronunciation review"), true);
  assert.equal(result.pendingPushSummary.endsWith("2026-03-17 18:30"), true);
});

test("buildSummaryNextStep keeps a generic fallback when nothing else is queued", () => {
  const result = buildSummaryNextStep(
    [
      {
        id: "task-current",
        status: "COMPLETED",
        summary: "done task",
        scheduledAt: "2026-03-17T07:00:00.000Z",
        content: {}
      }
    ],
    {
      currentTaskId: "task-current",
      needsReviewWordCount: 0
    }
  );

  assert.equal(result.actionType, "OPEN_TASK_PANEL");
  assert.equal(result.taskId, undefined);
  assert.equal(result.nextTaskSummary, "");
  assert.equal(result.nextTaskInsight, "");
  assert.equal(result.nextTaskCoachHint, "");
  assert.equal(result.pendingPushSummary, "");
});
