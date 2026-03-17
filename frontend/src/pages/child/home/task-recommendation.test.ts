import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskRecommendation } from "./task-recommendation.ts";

test("buildTaskRecommendation prefers delivered focus review task and keeps preview words", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-delivered",
      status: "DELIVERED",
      summary: "review apple",
      content: {
        mode: "word_review",
        coachHint: "read apple first",
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
      content: {}
    }
  ]);

  assert.equal(result?.actionType, "START_LEARNING");
  assert.equal(result?.taskId, "task-delivered");
  assert.equal(result?.summary, "review apple");
  assert.equal(result?.focusSummary.includes("apple"), true);
  assert.equal(result?.coachHint, "read apple first");
  assert.deepEqual(result?.previewWords, ["apple（复习）", "banana（新词）", "pear（复习）"]);
});

test("buildTaskRecommendation falls back to deliver-and-start", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-approved",
      status: "APPROVED",
      summary: "english task",
      content: {
        mode: "word_learning",
        priority: "high",
        dueWords: 2,
        newWords: 1
      }
    }
  ]);

  assert.equal(result?.actionType, "DELIVER_AND_START");
  assert.equal(result?.taskId, "task-approved");
  assert.equal(result?.summary, "english task");
  assert.equal(result?.countSummary?.includes("2"), true);
  assert.equal(result?.previewWords.length, 0);
});

test("buildTaskRecommendation returns null when no actionable task exists", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-completed",
      status: "COMPLETED",
      summary: "finished",
      content: {}
    }
  ]);

  assert.equal(result, null);
});
