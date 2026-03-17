type TaskStatus = "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";

interface TaskLike {
  id: string;
  status: TaskStatus;
  summary: string;
}

interface SummaryNextStepOptions {
  currentTaskId: string;
  needsReviewWordCount: number;
}

export interface SummaryNextStep {
  title: string;
  description: string;
  nextTaskSummary: string;
  actionLabel: string;
  actionType: "START_NEXT_TASK" | "DELIVER_AND_START_NEXT_TASK" | "OPEN_TASK_PANEL";
  taskId?: string;
}

export function buildSummaryNextStep(
  tasks: TaskLike[],
  options: SummaryNextStepOptions
): SummaryNextStep {
  const nextLearnableTask = tasks.find((task) => task.id !== options.currentTaskId && task.status === "DELIVERED");
  if (nextLearnableTask) {
    return {
      title: "下一步：继续下一条任务",
      description: `任务面板里还有 ${
        tasks.filter((task) => task.id !== options.currentTaskId && task.status === "DELIVERED").length
      } 条可直接开始的任务，返回后可以继续学习。`,
      nextTaskSummary: `下一个任务：${nextLearnableTask.summary}`,
      actionLabel: "继续下一条任务",
      actionType: "START_NEXT_TASK",
      taskId: nextLearnableTask.id
    };
  }

  const deliverableTasks = tasks.filter((task) => task.status === "APPROVED" || task.status === "MODIFIED");
  const deliverableCount = deliverableTasks.length;
  if (deliverableCount > 0) {
    return {
      title: "下一步：还有待投递任务",
      description: `任务面板里还有 ${deliverableCount} 条任务待投递，返回后先标记已投递，再开始学习。`,
      nextTaskSummary: `下一个任务：${deliverableTasks[0]?.summary ?? ""}`,
      actionLabel: "投递并继续下一条任务",
      actionType: "DELIVER_AND_START_NEXT_TASK",
      taskId: deliverableTasks[0]?.id
    };
  }

  if (options.needsReviewWordCount > 0) {
    return {
      title: "下一步：等待家长审批复习任务",
      description: `本次有 ${options.needsReviewWordCount} 个待复习单词，系统会生成下一轮复习推送，需家长审批后继续。`,
      nextTaskSummary: "",
      actionLabel: "返回任务面板查看进度",
      actionType: "OPEN_TASK_PANEL"
    };
  }

  return {
    title: "下一步：返回任务面板查看安排",
    description: "本轮学习已完成，返回任务面板查看今天是否还有新的学习任务。",
    nextTaskSummary: "",
    actionLabel: "返回任务面板",
    actionType: "OPEN_TASK_PANEL"
  };
}
