import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalAdjustmentPresets } from "./approval-adjustments.ts";

test("buildApprovalAdjustmentPresets returns review and pronunciation presets", () => {
  const result = buildApprovalAdjustmentPresets({
    mode: "word_learning",
    focusReviewWords: [
      { word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] },
      { word: "banana", incorrectItems: ["WORD_SPELLING"] }
    ]
  });

  assert.deepEqual(result, [
    {
      id: "focus_review",
      label: "仅复习重点词",
      adjustmentMode: "normal_review_mode",
      mode: "word_review",
      words: ["apple", "banana"],
      wordsLimit: 2,
      coachHint: "先复习最近出错的单词，再继续新的内容",
      priority: "high"
    },
    {
      id: "focus_pronunciation",
      label: "强化发音",
      adjustmentMode: "focus_pronunciation_mode",
      mode: "word_review",
      words: ["apple"],
      wordsLimit: 1,
      coachHint: "先大声朗读这些单词，重点纠正发音后再继续",
      priority: "high"
    }
  ]);
});

test("buildApprovalAdjustmentPresets returns empty array without focus review words", () => {
  assert.deepEqual(buildApprovalAdjustmentPresets({ mode: "word_learning" }), []);
});
