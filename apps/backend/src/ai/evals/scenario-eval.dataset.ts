import { LearningType } from "@prisma/client";
import { ScenarioFeedbackInput } from "../types/scenario-feedback";

export interface ScenarioEvalCase {
  id: string;
  input: ScenarioFeedbackInput;
  minScore: number;
  mustContain: string[];
}

export const scenarioEvalDataset: ScenarioEvalCase[] = [
  {
    id: "pronunciation-basic",
    input: {
      type: LearningType.PRONUNCIATION,
      topic: "animals",
      userInput: "I like cats and dogs.",
      grade: 3
    },
    minScore: 50,
    mustContain: ["sentence", "stress"]
  },
  {
    id: "sentence-building-short",
    input: {
      type: LearningType.SENTENCE_BUILDING,
      topic: "school",
      userInput: "I go to school every day.",
      grade: 4
    },
    minScore: 50,
    mustContain: ["sentence"]
  },
  {
    id: "reading-summary",
    input: {
      type: LearningType.READING,
      topic: "weather",
      userInput: "The weather is sunny and warm today.",
      grade: 5
    },
    minScore: 50,
    mustContain: ["paragraph", "sentence"]
  },
  {
    id: "dialogue-followup",
    input: {
      type: LearningType.ORAL_DIALOGUE,
      topic: "travel",
      userInput: "I want to visit Beijing in summer.",
      grade: 7
    },
    minScore: 50,
    mustContain: ["question", "conversation"]
  }
];
