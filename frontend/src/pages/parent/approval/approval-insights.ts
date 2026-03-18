export interface ApprovalInsight {
  modeLabel: string;
  priorityLabel: string;
  coachHint: string;
  focusReviewSummary: string;
}

export function buildApprovalInsight(content: Record<string, unknown>): ApprovalInsight | null {
  const mode = String(content.mode ?? "").trim();

  if (mode === "word_learning" || mode === "word_review") {
    return {
      modeLabel: "英语单词任务",
      priorityLabel: toPriorityLabel(content.priority),
      coachHint: String(content.coachHint ?? "").trim(),
      focusReviewSummary: buildFocusReviewSummary(content.focusReviewWords)
    };
  }

  if (mode === "textbook_content_review") {
    return {
      modeLabel: "教材内容任务",
      priorityLabel: toPriorityLabel(content.priority),
      coachHint: String(content.coachHint ?? "").trim(),
      focusReviewSummary: ""
    };
  }

  return null;
}

function toPriorityLabel(value: unknown): string {
  return String(value ?? "").trim().toLowerCase() === "high" ? "高优先级" : "常规";
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
      const labels = Array.isArray(item.incorrectItems)
        ? item.incorrectItems.map((entry) => toItemTypeLabel(entry)).filter(Boolean).join(" / ")
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
