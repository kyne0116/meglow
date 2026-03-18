import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskRecommendation } from "./task-recommendation.ts";

test("buildTaskRecommendation prefers delivered focus review task and keeps insight labels", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-delivered",
      status: "DELIVERED",
      summary: "review apple",
      scheduledAt: "2026-03-17T09:30:00.000Z",
      content: {
        mode: "word_review",
        adjustmentMode: "focus_pronunciation_mode",
        priority: "high",
        coachHint: "read apple first",
        dueWords: 2,
        newWords: 1,
        focusReviewWords: [{ word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] }],
        words: [
          { value: "apple", kind: "REVIEW" },
          { value: "banana", kind: "NEW" },
          { value: "pear", kind: "REVIEW" }
        ]
      }
    },
    {
      id: "task-approved",
      status: "APPROVED",
      summary: "new words",
      scheduledAt: "2026-03-17T11:00:00.000Z",
      content: {}
    }
  ]);

  assert.equal(result?.actionType, "START_LEARNING");
  assert.equal(result?.taskId, "task-delivered");
  assert.equal(result?.summary, "review apple");
  assert.equal(result?.modeLabel, "发音复习任务");
  assert.equal(result?.priorityLabel, "高优先级");
  assert.equal(result?.countSummary, "复习 2 个，新增 1 个");
  assert.equal(result?.focusSummary.includes("apple"), true);
  assert.equal(result?.coachHint, "read apple first");
  assert.equal(result?.scheduledTimeLabel, "2026-03-17 17:30");
  assert.deepEqual(result?.previewWords, ["apple（复习）", "banana（新词）", "pear（复习）"]);
});

test("buildTaskRecommendation falls back to deliver-and-start and keeps regular priority", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-approved",
      status: "APPROVED",
      summary: "english task",
      scheduledAt: "2026-03-17T07:15:00.000Z",
      content: {
        mode: "word_learning",
        dueWords: 2,
        newWords: 1
      }
    }
  ]);

  assert.equal(result?.actionType, "DELIVER_AND_START");
  assert.equal(result?.taskId, "task-approved");
  assert.equal(result?.summary, "english task");
  assert.equal(result?.modeLabel, "英语单词任务");
  assert.equal(result?.priorityLabel, "常规");
  assert.equal(result?.countSummary, "复习 2 个，新增 1 个");
  assert.equal(result?.scheduledTimeLabel, "2026-03-17 15:15");
  assert.equal(result?.previewWords.length, 0);
});

test("buildTaskRecommendation returns null when no actionable task exists", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-completed",
      status: "COMPLETED",
      summary: "finished",
      scheduledAt: "2026-03-17T07:15:00.000Z",
      content: {}
    }
  ]);

  assert.equal(result, null);
});
