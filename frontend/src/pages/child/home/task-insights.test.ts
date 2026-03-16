import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskInsight } from "./task-insights.ts";

test("buildTaskInsight parses english task details", () => {
  const result = buildTaskInsight({
    mode: "word_learning",
    dueWords: 2,
    newWords: 1,
    coachHint: "review due words first, then unlock new ones",
    priority: "high",
    focusReviewWords: [
      { word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] },
      { word: "banana", incorrectItems: ["WORD_SPELLING"] }
    ],
    words: [
      { value: "apple", kind: "REVIEW" },
      { value: "banana", kind: "REVIEW" },
      { value: "orange", kind: "NEW" },
      { value: "pear", kind: "NEW" }
    ]
  });

  assert.deepEqual(result, {
    modeLabel: "英语单词任务",
    countSummary: "复习 2 个，新增 1 个",
    coachHint: "review due words first, then unlock new ones",
    priorityLabel: "高优先级",
    previewWords: ["apple（复习）", "banana（复习）", "orange（新词）"],
    focusReviewSummary: "重点复习：apple（朗读题）、banana（拼写题）"
  });
});

test("buildTaskInsight parses textbook task details", () => {
  const result = buildTaskInsight({
    mode: "textbook_content_review",
    subjectName: "语文",
    nodeTitle: "第一课",
    totalContentItems: 3,
    coachHint: "follow the current textbook node and finish the attached content items",
    priority: "normal"
  });

  assert.deepEqual(result, {
    modeLabel: "教材内容任务",
    countSummary: "语文 / 第一课 / 3 个内容项",
    coachHint: "follow the current textbook node and finish the attached content items",
    priorityLabel: "常规",
    previewWords: []
  });
});

test("buildTaskInsight returns null for unsupported content", () => {
  assert.equal(buildTaskInsight({}), null);
  assert.equal(buildTaskInsight({ mode: "unknown" }), null);
});
