export interface TaskInsight {
  modeLabel: string;
  countSummary: string;
  coachHint: string;
  priorityLabel: string;
  previewWords: string[];
}

export function buildTaskInsight(content: Record<string, unknown>): TaskInsight | null {
  const mode = String(content.mode ?? "").trim();

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
      modeLabel: "英语单词任务",
      countSummary: `复习 ${dueWords} 个，新增 ${newWords} 个`,
      coachHint: String(content.coachHint ?? "").trim(),
      priorityLabel: toPriorityLabel(content.priority),
      previewWords
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
