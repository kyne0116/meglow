export interface PronunciationEvaluationInput {
  audioUrl?: string;
  transcript: string;
  expectedText?: string;
  grade?: number;
}

export interface PronunciationEvaluationOutput {
  provider: string;
  score: number;
  feedback: string;
  phonemeHints: string[];
}
