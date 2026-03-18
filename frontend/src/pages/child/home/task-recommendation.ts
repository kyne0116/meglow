type TaskStatus = "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";

interface TaskLike {
  id: string;
  status: TaskStatus;
  summary: string;
  scheduledAt?: string;
  content: Record<string, unknown>;
}

export interface TaskRecommendation {
  title: string;
  description: string;
  modeLabel: string;
  priorityLabel: string;
  countSummary?: string;
  scheduledTimeLabel: string;
  focusSummary: string;
  coachHint: string;
  previewWords: string[];
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
    return buildRecommendation(deliveredFocusTask, {
      title: "推荐下一步：开始重点复习",
      description: "先把最近出错的内容复习掉，再进入新的学习任务。",
      actionLabel: "开始学习",
      actionType: "START_LEARNING"
    });
  }

  const deliveredTask = tasks.find((task) => task.status === "DELIVERED");
  if (deliveredTask) {
    return buildRecommendation(deliveredTask, {
      title: "推荐下一步：开始今天的学习",
      description: "当前已有可直接开始的任务，先完成这一条最顺畅。",
      actionLabel: "开始学习",
      actionType: "START_LEARNING"
    });
  }

  const deliverableTask = tasks.find((task) => task.status === "APPROVED" || task.status === "MODIFIED");
  if (deliverableTask) {
    return buildRecommendation(deliverableTask, {
      title: "推荐下一步：投递后开始学习",
      description: "当前没有已投递任务，可以先投递这条任务并立即开始。",
      actionLabel: "投递并开始",
      actionType: "DELIVER_AND_START"
    });
  }

  return null;
}

function buildRecommendation(
  task: TaskLike,
  options: Pick<TaskRecommendation, "title" | "description" | "actionLabel" | "actionType">
): TaskRecommendation {
  const countSummary = toCountSummary(task.content);
  return {
    ...options,
    modeLabel: toModeLabel(task.content),
    priorityLabel: toPriorityLabel(task.content.priority),
    ...(countSummary ? { countSummary } : {}),
    scheduledTimeLabel: formatScheduledTime(task.scheduledAt),
    focusSummary: toFocusSummary(task.content.focusReviewWords),
    coachHint: String(task.content.coachHint ?? "").trim(),
    previewWords: toPreviewWords(task.content.words),
    taskId: task.id,
    summary: task.summary
  };
}

function formatScheduledTime(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toModeLabel(content: Record<string, unknown>): string {
  const mode = String(content.mode ?? "").trim();
  if (mode === "word_learning" || mode === "word_review") {
    return "英语单词任务";
  }
  if (mode === "textbook_content_review") {
    return "教材内容任务";
  }
  return "";
}

function toPriorityLabel(value: unknown): string {
  return String(value ?? "").trim().toLowerCase() === "high" ? "高优先级" : "常规";
}

function toCountSummary(content: Record<string, unknown>): string | undefined {
  const mode = String(content.mode ?? "").trim();
  if (mode !== "word_learning" && mode !== "word_review") {
    return undefined;
  }
  if (content.dueWords === undefined && content.newWords === undefined) {
    return undefined;
  }

  const dueWords = toCount(content.dueWords);
  const newWords = toCount(content.newWords);
  return `复习 ${dueWords} 个，新增 ${newWords} 个`;
}

function toCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
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

function toPreviewWords(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .slice(0, 3)
    .map((item) => {
      const word = String(item.value ?? "").trim();
      const kind = String(item.kind ?? "").trim().toUpperCase();
      const kindLabel = kind === "REVIEW" ? "复习" : "新词";
      return word ? `${word}（${kindLabel}）` : "";
    })
    .filter(Boolean);
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
