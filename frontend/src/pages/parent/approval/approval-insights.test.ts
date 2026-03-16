import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalInsight } from "./approval-insights.ts";

test("buildApprovalInsight extracts focus review summary for english push", () => {
  const result = buildApprovalInsight({
    mode: "word_learning",
    coachHint: "focus on pronunciation for apple before unlocking new words",
    focusReviewWords: [
      {
        word: "apple",
        incorrectItems: ["WORD_PRONUNCIATION"]
      },
      {
        word: "banana",
        incorrectItems: ["WORD_SPELLING"]
      }
    ]
  });

  assert.deepEqual(result, {
    modeLabel: "英语单词任务",
    coachHint: "focus on pronunciation for apple before unlocking new words",
    focusReviewSummary: "重点复习：apple（朗读题）、banana（拼写题）"
  });
});

test("buildApprovalInsight returns textbook mode label without focus review summary", () => {
  const result = buildApprovalInsight({
    mode: "textbook_content_review",
    coachHint: "follow the current textbook node and finish the attached content items"
  });

  assert.deepEqual(result, {
    modeLabel: "教材内容任务",
    coachHint: "follow the current textbook node and finish the attached content items",
    focusReviewSummary: ""
  });
});

test("buildApprovalInsight returns null for unsupported content", () => {
  assert.equal(buildApprovalInsight({}), null);
});
