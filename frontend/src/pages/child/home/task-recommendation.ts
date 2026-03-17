type TaskStatus = "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";

interface TaskLike {
  id: string;
  status: TaskStatus;
  summary: string;
  content: Record<string, unknown>;
}

export interface TaskRecommendation {
  title: string;
  description: string;
  actionLabel: string;
  actionType: "START_LEARNING" | "DELIVER_AND_START";
  taskId: string;
  summary: string;
}

export function buildTaskRecommendation(tasks: TaskLike[]): TaskRecommendation | null {
  const deliveredFocusTask = tasks.find(
    (task) => task.status === "DELIVERED" && Array.isArray(task.content.focusReviewWords) && task.content.focusReviewWords.length > 0
  );
  if (deliveredFocusTask) {
    return {
      title: "推荐下一步：开始重点复习",
      description: "先把最近出错的内容复习掉，再进入新的学习任务。",
      actionLabel: "开始学习",
      actionType: "START_LEARNING",
      taskId: deliveredFocusTask.id,
      summary: deliveredFocusTask.summary
    };
  }

  const deliveredTask = tasks.find((task) => task.status === "DELIVERED");
  if (deliveredTask) {
    return {
      title: "推荐下一步：开始今天的学习",
      description: "当前已有可直接开始的任务，先完成这一条最顺畅。",
      actionLabel: "开始学习",
      actionType: "START_LEARNING",
      taskId: deliveredTask.id,
      summary: deliveredTask.summary
    };
  }

  const deliverableTask = tasks.find((task) => task.status === "APPROVED" || task.status === "MODIFIED");
  if (deliverableTask) {
    return {
      title: "推荐下一步：投递后开始学习",
      description: "当前没有已投递任务，可以先投递这条任务并立即开始。",
      actionLabel: "投递并开始",
      actionType: "DELIVER_AND_START",
      taskId: deliverableTask.id,
      summary: deliverableTask.summary
    };
  }

  return null;
}
