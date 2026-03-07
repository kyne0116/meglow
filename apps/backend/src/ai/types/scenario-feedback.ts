import { LearningType } from "@prisma/client";

export interface ScenarioFeedbackInput {
  type: LearningType;
  topic: string;
  userInput: string;
  grade?: number;
}

export interface ScenarioFeedbackOutput {
  score: number;
  feedback: string;
  correction: string;
  encouragement: string;
  nextAction: string;
}
