export type PronunciationSelfRating = "NEEDS_PRACTICE" | "OK" | "GOOD";

export function getLearningItemTypeLabel(itemType: string): string {
  if (itemType === "WORD_MEANING") {
    return "词义题";
  }
  if (itemType === "WORD_SPELLING") {
    return "拼写题";
  }
  if (itemType === "WORD_PRONUNCIATION") {
    return "朗读题";
  }
  return itemType;
}

export function buildPronunciationAnswer(
  selfRating: PronunciationSelfRating = "OK"
): { completed: true; selfRating: PronunciationSelfRating } {
  return {
    completed: true,
    selfRating
  };
}
