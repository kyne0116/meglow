import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalRecommendation } from "./approval-recommendation.ts";

test("buildApprovalRecommendation prefers focus review push for modify flow", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-review",
      childName: "Ming",
      summary: "复习任务",
      reason: "need review",
      expectedOutcome: "review words",
      status: "PENDING_APPROVAL",
      scheduledAt: "2026-03-17T10:00:00.000Z",
      content: {
        mode: "word_review",
        focusReviewWords: [{ word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] }]
      }
    },
    {
      id: "push-normal",
      childName: "Ming",
      summary: "常规任务",
      reason: "normal",
      expectedOutcome: "learn",
      status: "PENDING_APPROVAL",
      scheduledAt: "2026-03-17T11:00:00.000Z",
      content: {}
    }
  ]);

  assert.deepEqual(result, {
    pushId: "push-review",
    title: "推荐处理：先确认重点复习任务",
    description: "这条待审批任务带有重点复习词，建议先检查后再通过或调整。",
    targetSummary: "复习任务",
    focusSummary: "重点复习：apple（朗读题）",
    actionLabel: "套用强化发音预设",
    actionType: "APPLY_PRESET",
    presetId: "focus_pronunciation"
  });
});

test("buildApprovalRecommendation falls back to focus review preset when no pronunciation weakness exists", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-review",
      childName: "Ming",
      summary: "复习任务",
      reason: "need review",
      expectedOutcome: "review words",
      status: "PENDING_APPROVAL",
      scheduledAt: "2026-03-17T10:00:00.000Z",
      content: {
        mode: "word_review",
        focusReviewWords: [{ word: "banana", incorrectItems: ["WORD_SPELLING"] }]
      }
    }
  ]);

  assert.deepEqual(result, {
    pushId: "push-review",
    title: "推荐处理：先确认重点复习任务",
    description: "这条待审批任务带有重点复习词，建议先检查后再通过或调整。",
    targetSummary: "复习任务",
    focusSummary: "重点复习：banana（拼写题）",
    actionLabel: "套用重点复习预设",
    actionType: "APPLY_PRESET",
    presetId: "focus_review"
  });
});

test("buildApprovalRecommendation falls back to high priority approve", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-high",
      childName: "Ming",
      summary: "高优先级任务",
      reason: "urgent",
      expectedOutcome: "learn",
      status: "PENDING_APPROVAL",
      scheduledAt: "2026-03-17T10:00:00.000Z",
      content: {
        priority: "high"
      }
    }
  ]);

  assert.deepEqual(result, {
    pushId: "push-high",
    title: "推荐处理：优先通过高优先级任务",
    description: "这条任务已标记为高优先级，若无额外调整可直接通过。",
    targetSummary: "高优先级任务",
    focusSummary: "",
    actionLabel: "直接通过",
    actionType: "APPROVE"
  });
});

test("buildApprovalRecommendation returns null for empty list", () => {
  assert.equal(buildApprovalRecommendation([]), null);
});
