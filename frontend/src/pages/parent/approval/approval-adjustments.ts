export interface ApprovalAdjustmentPreset {
  id: "focus_review" | "focus_pronunciation";
  label: string;
  adjustmentMode: "normal_review_mode" | "focus_pronunciation_mode";
  mode: "word_review";
  words: string[];
  wordsLimit: number;
  coachHint: string;
  priority: "high";
}

export function buildApprovalAdjustmentPresets(content: Record<string, unknown>): ApprovalAdjustmentPreset[] {
  const focusReviewWords = Array.isArray(content.focusReviewWords)
    ? content.focusReviewWords.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    : [];

  const reviewWords = focusReviewWords
    .map((item) => String(item.word ?? "").trim())
    .filter(Boolean);

  if (reviewWords.length === 0) {
    return [];
  }

  const presets: ApprovalAdjustmentPreset[] = [
    {
      id: "focus_review",
      label: "仅复习重点词",
      adjustmentMode: "normal_review_mode",
      mode: "word_review",
      words: reviewWords,
      wordsLimit: reviewWords.length,
      coachHint: "先复习最近出错的单词，再继续新的内容",
      priority: "high"
    }
  ];

  const pronunciationWords = focusReviewWords
    .filter((item) =>
      Array.isArray(item.incorrectItems) && item.incorrectItems.some((entry) => String(entry).trim() === "WORD_PRONUNCIATION")
    )
    .map((item) => String(item.word ?? "").trim())
    .filter(Boolean);

  if (pronunciationWords.length > 0) {
    presets.push({
      id: "focus_pronunciation",
      label: "强化发音",
      adjustmentMode: "focus_pronunciation_mode",
      mode: "word_review",
      words: pronunciationWords,
      wordsLimit: pronunciationWords.length,
      coachHint: "先大声朗读这些单词，重点纠正发音后再继续",
      priority: "high"
    });
  }

  return presets;
}
