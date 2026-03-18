type TaskStatus = "APPROVED" | "MODIFIED" | "DELIVERED" | "COMPLETED";

interface TaskLike {
  id: string;
  status: TaskStatus;
  summary: string;
  scheduledAt?: string;
  content: Record<string, unknown>;
}

interface SummaryNextStepOptions {
  currentTaskId: string;
  needsReviewWordCount: number;
  pendingPushSummary?: string;
  pendingPushScheduledAt?: string;
  pendingPushContent?: Record<string, unknown>;
}

export interface SummaryNextStep {
  title: string;
  description: string;
  nextTaskSummary: string;
  nextTaskInsight: string;
  nextTaskCoachHint: string;
  nextTaskPreviewWords: string;
  pendingPushSummary: string;
  pendingPushInsight: string;
  pendingPushFocusReviewSummary: string;
  pendingPushCoachHint: string;
  pendingPushPreviewWords: string;
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
      nextTaskSummary: buildNextTaskSummary(nextLearnableTask.summary, nextLearnableTask.scheduledAt),
      nextTaskInsight: buildTaskInsight(nextLearnableTask.content),
      nextTaskCoachHint: String(nextLearnableTask.content.coachHint ?? "").trim(),
      nextTaskPreviewWords: buildPreviewWords(nextLearnableTask.content.words),
      pendingPushSummary: "",
      pendingPushInsight: "",
      pendingPushFocusReviewSummary: "",
      pendingPushCoachHint: "",
      pendingPushPreviewWords: "",
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
      nextTaskSummary: buildNextTaskSummary(nextDeliverableTask.summary, nextDeliverableTask.scheduledAt),
      nextTaskInsight: buildTaskInsight(nextDeliverableTask.content),
      nextTaskCoachHint: String(nextDeliverableTask.content.coachHint ?? "").trim(),
      nextTaskPreviewWords: buildPreviewWords(nextDeliverableTask.content.words),
      pendingPushSummary: "",
      pendingPushInsight: "",
      pendingPushFocusReviewSummary: "",
      pendingPushCoachHint: "",
      pendingPushPreviewWords: "",
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
      nextTaskInsight: "",
      nextTaskCoachHint: "",
      nextTaskPreviewWords: "",
      pendingPushSummary: buildPendingPushSummary(options.pendingPushSummary, options.pendingPushScheduledAt),
      pendingPushInsight: buildTaskInsight(options.pendingPushContent),
      pendingPushFocusReviewSummary: buildFocusReviewSummary(options.pendingPushContent?.focusReviewWords),
      pendingPushCoachHint: String(options.pendingPushContent?.coachHint ?? "").trim(),
      pendingPushPreviewWords: buildPreviewWords(options.pendingPushContent?.words),
      actionLabel: "返回任务面板查看进度",
      actionType: "OPEN_TASK_PANEL"
    };
  }

  return {
    title: "下一步：返回任务面板查看安排",
    description: "本轮学习已完成，返回任务面板查看今天是否还有新的学习任务。",
    nextTaskSummary: "",
    nextTaskInsight: "",
    nextTaskCoachHint: "",
    nextTaskPreviewWords: "",
    pendingPushSummary: "",
    pendingPushInsight: "",
    pendingPushFocusReviewSummary: "",
    pendingPushCoachHint: "",
    pendingPushPreviewWords: "",
    actionLabel: "返回任务面板",
    actionType: "OPEN_TASK_PANEL"
  };
}

function buildNextTaskSummary(summary: string, scheduledAt?: string): string {
  const formattedTime = formatScheduledAt(scheduledAt);
  if (!formattedTime) {
    return `下一个任务：${summary}`;
  }

  return `下一个任务：${summary}，计划时间：${formattedTime}`;
}

function buildTaskInsight(content?: Record<string, unknown>): string {
  if (!content) {
    return "";
  }

  const modeLabel = toModeLabel(content);
  const priorityLabel = toPriorityLabel(content.priority);
  const countSummary = toCountSummary(content);
  return [modeLabel, priorityLabel, countSummary].filter(Boolean).join(" · ");
}

function buildPendingPushSummary(summary?: string, scheduledAt?: string): string {
  if (!summary) {
    return "";
  }

  const formattedTime = formatScheduledAt(scheduledAt);
  if (!formattedTime) {
    return `待家长审批推送：${summary}`;
  }

  return `待家长审批推送：${summary}，计划时间：${formattedTime}`;
}

function buildPreviewWords(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
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
    .filter(Boolean)
    .join("、");
}

function buildFocusReviewSummary(value: unknown): string {
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
    .join("。");

  return summary ? `重点复习：${summary}` : "";
}

function toModeLabel(content: Record<string, unknown>): string {
  const mode = String(content.mode ?? "").trim();
  const adjustmentMode = String(content.adjustmentMode ?? "").trim();
  if (mode === "word_review" && adjustmentMode === "focus_pronunciation_mode") {
    return "发音复习任务";
  }
  if (mode === "word_review") {
    return "重点复习任务";
  }
  if (mode === "word_learning") {
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

function toCountSummary(content: Record<string, unknown>): string {
  const mode = String(content.mode ?? "").trim();
  if (mode !== "word_learning" && mode !== "word_review") {
    return "";
  }
  if (content.dueWords === undefined && content.newWords === undefined) {
    return "";
  }

  const dueWords = toCount(content.dueWords);
  const newWords = toCount(content.newWords);
  return `复习 ${dueWords} 个，新增 ${newWords} 个`;
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
    return "释义题";
  }
  return "";
}

function toCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function formatScheduledAt(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(
      date.getHours()
    )}:${pad2(date.getMinutes())}`;
  }

  return value;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
