type TaskStatus = "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";

interface TaskLike {
  id: string;
  status: TaskStatus;
  summary: string;
}

interface SummaryNextStepOptions {
  currentTaskId: string;
  needsReviewWordCount: number;
  pendingPushSummary?: string;
  pendingPushScheduledAt?: string;
}

export interface SummaryNextStep {
  title: string;
  description: string;
  nextTaskSummary: string;
  pendingPushSummary: string;
  actionLabel: string;
  actionType: "START_NEXT_TASK" | "DELIVER_AND_START_NEXT_TASK" | "OPEN_TASK_PANEL";
  taskId?: string;
}

export function buildSummaryNextStep(tasks: TaskLike[], options: SummaryNextStepOptions): SummaryNextStep {
  const nextLearnableTasks = tasks.filter(
    (task) => task.id !== options.currentTaskId && task.status === "DELIVERED"
  );
  const nextLearnableTask = nextLearnableTasks[0];
  if (nextLearnableTask) {
    return {
      title: "下一步：继续下一条任务",
      description: `任务面板里还有 ${nextLearnableTasks.length} 条可直接开始的任务，返回后可以继续学习。`,
      nextTaskSummary: `下一个任务：${nextLearnableTask.summary}`,
      pendingPushSummary: "",
      actionLabel: "继续下一条任务",
      actionType: "START_NEXT_TASK",
      taskId: nextLearnableTask.id
    };
  }

  const deliverableTasks = tasks.filter((task) => task.status === "APPROVED" || task.status === "MODIFIED");
  const nextDeliverableTask = deliverableTasks[0];
  if (nextDeliverableTask) {
    return {
      title: "下一步：还有待投递任务",
      description: `任务面板里还有 ${deliverableTasks.length} 条任务待投递，返回后先标记已投递，再开始学习。`,
      nextTaskSummary: `下一个任务：${nextDeliverableTask.summary}`,
      pendingPushSummary: "",
      actionLabel: "投递并继续下一条任务",
      actionType: "DELIVER_AND_START_NEXT_TASK",
      taskId: nextDeliverableTask.id
    };
  }

  if (options.needsReviewWordCount > 0) {
    return {
      title: "下一步：等待家长审批复习任务",
      description: `本次有 ${options.needsReviewWordCount} 个待复习单词，系统会生成下一轮复习推送，需要家长审批后继续。`,
      nextTaskSummary: "",
      pendingPushSummary: buildPendingPushSummary(options.pendingPushSummary, options.pendingPushScheduledAt),
      actionLabel: "返回任务面板查看进度",
      actionType: "OPEN_TASK_PANEL"
    };
  }

  return {
    title: "下一步：返回任务面板查看安排",
    description: "本轮学习已完成，返回任务面板查看今天是否还有新的学习任务。",
    nextTaskSummary: "",
    pendingPushSummary: "",
    actionLabel: "返回任务面板",
    actionType: "OPEN_TASK_PANEL"
  };
}

function buildPendingPushSummary(summary?: string, scheduledAt?: string): string {
  if (!summary) {
    return "";
  }

  const formattedTime = formatScheduledAt(scheduledAt);
  if (!formattedTime) {
    return `待审批推送：${summary}`;
  }

  return `待审批推送：${summary}，计划时间：${formattedTime}`;
}

function formatScheduledAt(value?: string): string {
  if (!value) {
    return "";
  }

  if (value.includes("T")) {
    return value.slice(0, 16).replace("T", " ");
  }

  return value;
}
