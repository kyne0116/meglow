interface PendingPushLike {
  id: string;
  childName?: string;
  summary?: string;
  expectedOutcome?: string;
  scheduledAt?: string;
  content: Record<string, unknown>;
}

export interface ApprovalRecommendation {
  pushId: string;
  childName: string;
  title: string;
  description: string;
  modeLabel: string;
  priorityLabel: string;
  countSummary: string;
  previewWords: string[];
  targetSummary: string;
  expectedOutcome: string;
  scheduledTimeLabel: string;
  focusSummary: string;
  coachHint: string;
  actionLabel: string;
  actionType: "APPLY_PRESET" | "APPROVE";
  presetId?: "focus_review" | "focus_pronunciation";
}

export function buildApprovalRecommendation(pending: PendingPushLike[]): ApprovalRecommendation | null {
  const focusReviewPush = pending.find(
    (item) => Array.isArray(item.content.focusReviewWords) && item.content.focusReviewWords.length > 0
  );
  if (focusReviewPush) {
    const hasPronunciationWeakness = (focusReviewPush.content.focusReviewWords as unknown[]).some((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }
      const incorrectItems = (entry as { incorrectItems?: unknown }).incorrectItems;
      return Array.isArray(incorrectItems) && incorrectItems.some((item) => String(item).trim() === "WORD_PRONUNCIATION");
    });
    return {
      pushId: focusReviewPush.id,
      childName: String(focusReviewPush.childName ?? "").trim(),
      title: "推荐处理：先确认重点复习任务",
      description: "这条待审批任务带有重点复习词，建议先检查后再通过或调整。",
      modeLabel: toModeLabel(focusReviewPush.content),
      priorityLabel: toPriorityLabel(focusReviewPush.content.priority),
      countSummary: toCountSummary(focusReviewPush.content),
      previewWords: toPreviewWords(focusReviewPush.content.words),
      targetSummary: String(focusReviewPush.summary ?? "").trim(),
      expectedOutcome: String(focusReviewPush.expectedOutcome ?? "").trim(),
      scheduledTimeLabel: formatScheduledTime(focusReviewPush.scheduledAt),
      focusSummary: toFocusSummary(focusReviewPush.content.focusReviewWords),
      coachHint: String(focusReviewPush.content.coachHint ?? "").trim(),
      actionLabel: hasPronunciationWeakness ? "套用强化发音预设" : "套用重点复习预设",
      actionType: "APPLY_PRESET",
      presetId: hasPronunciationWeakness ? "focus_pronunciation" : "focus_review"
    };
  }

  const highPriorityPush = pending.find((item) => String(item.content.priority ?? "").trim().toLowerCase() === "high");
  if (highPriorityPush) {
    return {
      pushId: highPriorityPush.id,
      childName: String(highPriorityPush.childName ?? "").trim(),
      title: "推荐处理：优先通过高优先级任务",
      description: "这条任务已标记为高优先级，若无额外调整可直接通过。",
      modeLabel: toModeLabel(highPriorityPush.content),
      priorityLabel: toPriorityLabel(highPriorityPush.content.priority),
      countSummary: toCountSummary(highPriorityPush.content),
      previewWords: toPreviewWords(highPriorityPush.content.words),
      targetSummary: String(highPriorityPush.summary ?? "").trim(),
      expectedOutcome: String(highPriorityPush.expectedOutcome ?? "").trim(),
      scheduledTimeLabel: formatScheduledTime(highPriorityPush.scheduledAt),
      focusSummary: "",
      coachHint: String(highPriorityPush.content.coachHint ?? "").trim(),
      actionLabel: "直接通过",
      actionType: "APPROVE"
    };
  }

  return null;
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

function toCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
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

function toFocusSummary(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  const summary = value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .slice(0, 2)
    .map((item) => {
      const word = String(item.word ?? "").trim();
      const labels = Array.isArray(item.incorrectItems)
        ? item.incorrectItems
            .map((entry) => toItemTypeLabel(entry))
            .filter(Boolean)
            .join(" / ")
        : "";
      return word ? `${word}${labels ? `（${labels}）` : ""}` : "";
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
