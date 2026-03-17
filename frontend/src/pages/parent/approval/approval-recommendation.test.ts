import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalRecommendation } from "./approval-recommendation.ts";

test("buildApprovalRecommendation prefers focus review push and carries outcome and coach hint", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-review",
      summary: "review task",
      expectedOutcome: "review the weak words",
      content: {
        mode: "word_review",
        coachHint: "start with apple aloud",
        focusReviewWords: [{ word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] }]
      }
    },
    {
      id: "push-normal",
      summary: "normal task",
      expectedOutcome: "finish normal learning",
      content: {}
    }
  ]);

  assert.equal(result?.pushId, "push-review");
  assert.equal(result?.actionType, "APPLY_PRESET");
  assert.equal(result?.presetId, "focus_pronunciation");
  assert.equal(result?.targetSummary, "review task");
  assert.equal(result?.expectedOutcome, "review the weak words");
  assert.equal(result?.coachHint, "start with apple aloud");
  assert.equal(result?.focusSummary.includes("apple"), true);
});

test("buildApprovalRecommendation falls back to focus review preset when no pronunciation weakness exists", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-review",
      summary: "review task",
      expectedOutcome: "review spelling",
      content: {
        mode: "word_review",
        coachHint: "spell banana twice",
        focusReviewWords: [{ word: "banana", incorrectItems: ["WORD_SPELLING"] }]
      }
    }
  ]);

  assert.equal(result?.pushId, "push-review");
  assert.equal(result?.actionType, "APPLY_PRESET");
  assert.equal(result?.presetId, "focus_review");
  assert.equal(result?.expectedOutcome, "review spelling");
  assert.equal(result?.coachHint, "spell banana twice");
});

test("buildApprovalRecommendation falls back to high priority approve and keeps expected outcome", () => {
  const result = buildApprovalRecommendation([
    {
      id: "push-high",
      summary: "high priority task",
      expectedOutcome: "finish today",
      content: {
        priority: "high",
        coachHint: "complete it first"
      }
    }
  ]);

  assert.equal(result?.pushId, "push-high");
  assert.equal(result?.actionType, "APPROVE");
  assert.equal(result?.expectedOutcome, "finish today");
  assert.equal(result?.coachHint, "complete it first");
});

test("buildApprovalRecommendation returns null for empty list", () => {
  assert.equal(buildApprovalRecommendation([]), null);
});
