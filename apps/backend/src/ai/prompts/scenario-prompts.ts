import { LearningType } from "@prisma/client";

export function buildScenarioPrompt(
  type: LearningType,
  topic: string,
  input: string,
  grade?: number
): string {
  const scene = mapTypeToScene(type);
  return [
    `You are an English tutor for K12 students.`,
    `Scene: ${scene}.`,
    `Grade: ${grade ?? "unknown"}.`,
    `Topic: ${topic || "general"}.`,
    `Student input: ${input}.`,
    `Return strict JSON with keys: score, feedback, correction, encouragement, nextAction.`,
    `score must be 0..100.`
  ].join("\n");
}

function mapTypeToScene(type: LearningType): string {
  if (type === LearningType.PRONUNCIATION) return "pronunciation";
  if (type === LearningType.SENTENCE_BUILDING) return "sentence_building";
  if (type === LearningType.READING) return "reading";
  if (type === LearningType.ORAL_DIALOGUE) return "oral_dialogue";
  return "general";
}
