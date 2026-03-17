import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskRecommendation } from "./task-recommendation.ts";

test("buildTaskRecommendation prefers delivered focus review task", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-delivered",
      status: "DELIVERED",
      summary: "复习 apple",
      content: {
        mode: "word_review",
        coachHint: "先把 apple 读顺",
        focusReviewWords: [{ word: "apple", incorrectItems: ["WORD_PRONUNCIATION"] }]
      }
    },
    {
      id: "task-approved",
      status: "APPROVED",
      summary: "新词学习",
      content: {}
    }
  ]);

  assert.deepEqual(result, {
    title: "推荐下一步：开始重点复习",
    description: "先把最近出错的内容复习掉，再进入新的学习任务。",
    actionLabel: "开始学习",
    actionType: "START_LEARNING",
    taskId: "task-delivered",
    summary: "复习 apple"
  });
});

test("buildTaskRecommendation falls back to deliver-and-start", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-approved",
      status: "APPROVED",
      summary: "英语单词任务",
      content: {
        mode: "word_learning",
        priority: "high"
      }
    }
  ]);

  assert.deepEqual(result, {
    title: "推荐下一步：投递后开始学习",
    description: "当前没有已投递任务，可以先投递这条任务并立即开始。",
    actionLabel: "投递并开始",
    actionType: "DELIVER_AND_START",
    taskId: "task-approved",
    summary: "英语单词任务"
  });
});

test("buildTaskRecommendation returns null when no actionable task exists", () => {
  const result = buildTaskRecommendation([
    {
      id: "task-completed",
      status: "COMPLETED",
      summary: "今日任务完成",
      content: {}
    }
  ]);

  assert.equal(result, null);
});
