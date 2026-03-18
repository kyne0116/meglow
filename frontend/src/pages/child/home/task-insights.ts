export interface TaskInsight {
  modeLabel: string;
  countSummary: string;
  coachHint: string;
  priorityLabel: string;
  previewWords: string[];
  focusReviewSummary?: string;
}

export function buildTaskInsight(content: Record<string, unknown>): TaskInsight | null {
  const mode = String(content.mode ?? "").trim();
  const adjustmentMode = String(content.adjustmentMode ?? "").trim();

  if (mode === "word_learning" || mode === "word_review") {
    const dueWords = toCount(content.dueWords);
    const newWords = toCount(content.newWords);
    const previewWords = Array.isArray(content.words)
      ? content.words
          .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
          .slice(0, 3)
          .map((item) => {
            const value = String(item.value ?? "").trim();
            const kind = String(item.kind ?? "").trim().toUpperCase();
            const kindLabel = kind === "REVIEW" ? "复习" : "新词";
            return value ? `${value}（${kindLabel}）` : "";
          })
          .filter(Boolean)
      : [];

    return {
      modeLabel:
        mode === "word_review" && adjustmentMode === "focus_pronunciation_mode"
          ? "发音复习任务"
          : mode === "word_review"
            ? "重点复习任务"
            : "英语单词任务",
      countSummary: `复习 ${dueWords} 个，新增 ${newWords} 个`,
      coachHint: String(content.coachHint ?? "").trim(),
      priorityLabel: toPriorityLabel(content.priority),
      previewWords,
      focusReviewSummary: toFocusReviewSummary(content.focusReviewWords)
    };
  }

  if (mode === "textbook_content_review") {
    const subjectName = String(content.subjectName ?? "").trim();
    const nodeTitle = String(content.nodeTitle ?? "").trim();
    const totalContentItems = toCount(content.totalContentItems);

    return {
      modeLabel: "教材内容任务",
      countSummary: [subjectName, nodeTitle, `${totalContentItems} 个内容项`].filter(Boolean).join(" / "),
      coachHint: String(content.coachHint ?? "").trim(),
      priorityLabel: toPriorityLabel(content.priority),
      previewWords: []
    };
  }

  return null;
}

function toCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function toPriorityLabel(value: unknown): string {
  return String(value ?? "").trim().toLowerCase() === "high" ? "高优先级" : "常规";
}

function toFocusReviewSummary(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
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

  return summary ? `重点复习：${summary}` : undefined;
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
