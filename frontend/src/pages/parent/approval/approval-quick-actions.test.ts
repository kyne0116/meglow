import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalQuickActions } from "./approval-quick-actions.ts";

test("buildApprovalQuickActions exposes quick preset actions for focus review content", () => {
  const result = buildApprovalQuickActions({
    mode: "word_review",
    focusReviewWords: [
      { word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] },
      { word: "banana", incorrectItems: ["WORD_SPELLING"] }
    ]
  });

  assert.deepEqual(result, [
    {
      presetId: "focus_review",
      label: "快速套用：仅复习重点词"
    },
    {
      presetId: "focus_pronunciation",
      label: "快速套用：强化发音"
    }
  ]);
});

test("buildApprovalQuickActions returns empty list for unsupported content", () => {
  assert.deepEqual(buildApprovalQuickActions({}), []);
});
