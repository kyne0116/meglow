type TaskStatus = "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";

interface TaskLike {
  id: string;
  status: TaskStatus;
}

interface SummaryNextStepOptions {
  currentTaskId: string;
  needsReviewWordCount: number;
}

export interface SummaryNextStep {
  title: string;
  description: string;
  actionLabel: string;
}

export function buildSummaryNextStep(
  tasks: TaskLike[],
  options: SummaryNextStepOptions
): SummaryNextStep {
  const remainingLearnableCount = tasks.filter(
    (task) => task.id !== options.currentTaskId && task.status === "DELIVERED"
  ).length;
  if (remainingLearnableCount > 0) {
    return {
      title: "下一步：继续学习剩余任务",
      description: `任务面板里还有 ${remainingLearnableCount} 条可直接开始的任务，返回后可以继续学习。`,
      actionLabel: "返回任务面板继续学习"
    };
  }

  const deliverableCount = tasks.filter((task) => task.status === "APPROVED" || task.status === "MODIFIED").length;
  if (deliverableCount > 0) {
    return {
      title: "下一步：还有待投递任务",
      description: `任务面板里还有 ${deliverableCount} 条任务待投递，返回后先标记已投递，再开始学习。`,
      actionLabel: "返回任务面板处理任务"
    };
  }

  if (options.needsReviewWordCount > 0) {
    return {
      title: "下一步：等待家长审批复习任务",
      description: `本次有 ${options.needsReviewWordCount} 个待复习单词，系统会生成下一轮复习推送，需家长审批后继续。`,
      actionLabel: "返回任务面板查看进度"
    };
  }

  return {
    title: "下一步：返回任务面板查看安排",
    description: "本轮学习已完成，返回任务面板查看今天是否还有新的学习任务。",
    actionLabel: "返回任务面板"
  };
}
