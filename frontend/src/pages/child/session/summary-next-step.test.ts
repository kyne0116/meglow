import assert from "node:assert/strict";
import test from "node:test";
import { buildSummaryNextStep } from "./summary-next-step.ts";

test("buildSummaryNextStep prefers remaining delivered tasks", () => {
  const result = buildSummaryNextStep(
    [
      { id: "task-current", status: "COMPLETED", summary: "已完成任务" },
      { id: "task-next", status: "DELIVERED", summary: "英语复习任务" },
      { id: "task-later", status: "APPROVED", summary: "后续任务" }
    ],
    { currentTaskId: "task-current", needsReviewWordCount: 1 }
  );

  assert.deepEqual(result, {
    title: "下一步：继续下一条任务",
    description: "任务面板里还有 1 条可直接开始的任务，返回后可以继续学习。",
    nextTaskSummary: "下一个任务：英语复习任务",
    pendingPushSummary: "",
    actionLabel: "继续下一条任务",
    actionType: "START_NEXT_TASK",
    taskId: "task-next"
  });
});

test("buildSummaryNextStep falls back to deliverable tasks", () => {
  const result = buildSummaryNextStep(
    [
      { id: "task-current", status: "COMPLETED", summary: "已完成任务" },
      { id: "task-next", status: "APPROVED", summary: "今日英语任务" },
      { id: "task-later", status: "MODIFIED", summary: "稍后任务" }
    ],
    { currentTaskId: "task-current", needsReviewWordCount: 0 }
  );

  assert.deepEqual(result, {
    title: "下一步：还有待投递任务",
    description: "任务面板里还有 2 条任务待投递，返回后先标记已投递，再开始学习。",
    nextTaskSummary: "下一个任务：今日英语任务",
    pendingPushSummary: "",
    actionLabel: "投递并继续下一条任务",
    actionType: "DELIVER_AND_START_NEXT_TASK",
    taskId: "task-next"
  });
});

test("buildSummaryNextStep explains review wait when no visible task remains", () => {
  const result = buildSummaryNextStep([{ id: "task-current", status: "COMPLETED", summary: "已完成任务" }], {
    currentTaskId: "task-current",
    needsReviewWordCount: 2,
    pendingPushSummary: "下一轮复习任务：apple 发音专项"
  });

  assert.deepEqual(result, {
    title: "下一步：等待家长审批复习任务",
    description: "本次有 2 个待复习单词，系统会生成下一轮复习推送，需家长审批后继续。",
    nextTaskSummary: "",
    pendingPushSummary: "待审批推送：下一轮复习任务：apple 发音专项",
    actionLabel: "返回任务面板查看进度",
    actionType: "OPEN_TASK_PANEL"
  });
});

test("buildSummaryNextStep keeps a generic fallback when nothing else is queued", () => {
  const result = buildSummaryNextStep([{ id: "task-current", status: "COMPLETED", summary: "已完成任务" }], {
    currentTaskId: "task-current",
    needsReviewWordCount: 0
  });

  assert.deepEqual(result, {
    title: "下一步：返回任务面板查看安排",
    description: "本轮学习已完成，返回任务面板查看今天是否还有新的学习任务。",
    nextTaskSummary: "",
    pendingPushSummary: "",
    actionLabel: "返回任务面板",
    actionType: "OPEN_TASK_PANEL"
  });
});
