import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalRecommendation } from "./approval-recommendation.ts";

test("buildApprovalRecommendation prefers focus review push and carries child and mode labels", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-review",
      childName: "Ming",
      summary: "review task",
      expectedOutcome: "review the weak words",
      scheduledAt: "2026-03-17T10:00:00.000Z",
      content: {
        mode: "word_review",
        priority: "high",
        coachHint: "start with apple aloud",
        focusReviewWords: [{ word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] }]
      }
    },
    {
      id: "push-normal",
      childName: "Ming",
      summary: "normal task",
      expectedOutcome: "finish normal learning",
      content: {}
    }
  ]);

  assert.equal(result?.pushId, "push-review");
  assert.equal(result?.childName, "Ming");
  assert.equal(result?.modeLabel, "英语单词任务");
  assert.equal(result?.priorityLabel, "高优先级");
  assert.equal(result?.actionType, "APPLY_PRESET");
  assert.equal(result?.presetId, "focus_pronunciation");
  assert.equal(result?.targetSummary, "review task");
  assert.equal(result?.expectedOutcome, "review the weak words");
  assert.equal(result?.coachHint, "start with apple aloud");
  assert.equal(result?.scheduledTimeLabel, "2026-03-17 18:00");
  assert.equal(result?.focusSummary.includes("apple"), true);
});

test("buildApprovalRecommendation falls back to focus review preset when no pronunciation weakness exists", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-review",
      childName: "Ming",
      summary: "review task",
      expectedOutcome: "review spelling",
      scheduledAt: "2026-03-17T11:30:00.000Z",
      content: {
        mode: "word_review",
        coachHint: "spell banana twice",
        focusReviewWords: [{ word: "banana", incorrectItems: ["WORD_SPELLING"] }]
      }
    }
  ]);

  assert.equal(result?.pushId, "push-review");
  assert.equal(result?.childName, "Ming");
  assert.equal(result?.modeLabel, "英语单词任务");
  assert.equal(result?.priorityLabel, "常规");
  assert.equal(result?.actionType, "APPLY_PRESET");
  assert.equal(result?.presetId, "focus_review");
  assert.equal(result?.expectedOutcome, "review spelling");
  assert.equal(result?.coachHint, "spell banana twice");
  assert.equal(result?.scheduledTimeLabel, "2026-03-17 19:30");
});

test("buildApprovalRecommendation falls back to high priority approve and keeps child and mode labels", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-high",
      childName: "Ming",
      summary: "high priority task",
      expectedOutcome: "finish today",
      scheduledAt: "2026-03-17T08:15:00.000Z",
      content: {
        mode: "word_learning",
        priority: "high",
        coachHint: "complete it first"
      }
    }
  ]);

  assert.equal(result?.pushId, "push-high");
  assert.equal(result?.childName, "Ming");
  assert.equal(result?.modeLabel, "英语单词任务");
  assert.equal(result?.priorityLabel, "高优先级");
  assert.equal(result?.actionType, "APPROVE");
  assert.equal(result?.expectedOutcome, "finish today");
  assert.equal(result?.coachHint, "complete it first");
  assert.equal(result?.scheduledTimeLabel, "2026-03-17 16:15");
});

test("buildApprovalRecommendation returns null for empty list", () => {
  assert.equal(buildApprovalRecommendation([]), null);
});
