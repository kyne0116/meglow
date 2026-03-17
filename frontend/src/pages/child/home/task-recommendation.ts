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
  focusSummary: string;
  coachHint: string;
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
      focusSummary: toFocusSummary(deliveredFocusTask.content.focusReviewWords),
      coachHint: String(deliveredFocusTask.content.coachHint ?? "").trim(),
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
      focusSummary: toFocusSummary(deliveredTask.content.focusReviewWords),
      coachHint: String(deliveredTask.content.coachHint ?? "").trim(),
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
      focusSummary: "",
      coachHint: "",
      actionLabel: "投递并开始",
      actionType: "DELIVER_AND_START",
      taskId: deliverableTask.id,
      summary: deliverableTask.summary
    };
  }

  return null;
}

function toFocusSummary(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  const summary = value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .slice(0, 2)
    .map((item) => {
      const word = String(item.word ?? "").trim();
      const incorrectItems = Array.isArray(item.incorrectItems)
        ? item.incorrectItems
            .map((entry) => toItemTypeLabel(entry))
            .filter(Boolean)
            .join(" / ")
        : "";
      return word ? `${word}${incorrectItems ? `（${incorrectItems}）` : ""}` : "";
    })
    .filter(Boolean)
    .join("、");

  return summary ? `重点复习：${summary}` : "";
}

function toItemTypeLabel(value: unknown): string {
  const itemType = String(value ?? "").trim().toUpperCase();
  if (itemType === "WORD_PRONUNCIATION") {
    return "朗读题";
  }
  if (itemType === "WORD_SPELLING") {
    return "拼写题";
  }
  if (itemType === "WORD_MEANING") {
    return "词义题";
  }
  return "";
}
