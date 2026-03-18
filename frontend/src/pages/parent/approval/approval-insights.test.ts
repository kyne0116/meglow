import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalInsight } from "./approval-insights.ts";

test("buildApprovalInsight extracts focus review summary, priority, and preview for english push", () => {
  const result = buildApprovalInsight({
    mode: "word_learning",
    priority: "high",
    dueWords: 2,
    newWords: 1,
    words: [
      { value: "apple", kind: "REVIEW" },
      { value: "banana", kind: "NEW" }
    ],
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
    priorityLabel: "高优先级",
    countSummary: "复习 2 个，新增 1 个",
    previewWords: ["apple（复习）", "banana（新词）"],
    coachHint: "focus on pronunciation for apple before unlocking new words",
    focusReviewSummary: "重点复习：apple（朗读题）、banana（拼写题）"
  });
});

test("buildApprovalInsight returns textbook mode label with regular priority when missing", () => {
  const result = buildApprovalInsight({
    mode: "textbook_content_review",
    subjectName: "English",
    nodeTitle: "Unit 1",
    totalContentItems: 3,
    coachHint: "follow the current textbook node and finish the attached content items"
  });

  assert.deepEqual(result, {
    modeLabel: "教材内容任务",
    priorityLabel: "常规",
    countSummary: "English / Unit 1 / 3 个内容项",
    previewWords: [],
    coachHint: "follow the current textbook node and finish the attached content items",
    focusReviewSummary: ""
  });
});

test("buildApprovalInsight returns null for unsupported content", () => {
  assert.equal(buildApprovalInsight({}), null);
});
