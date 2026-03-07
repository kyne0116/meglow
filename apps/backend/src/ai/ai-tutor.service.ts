import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LearningType } from "@prisma/client";
import { LlmGatewayService } from "./llm-gateway.service";
import { buildScenarioPrompt } from "./prompts/scenario-prompts";
import { ScenarioFeedbackInput, ScenarioFeedbackOutput } from "./types/scenario-feedback";

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly llmGatewayService: LlmGatewayService
  ) {}

  async evaluateScenario(input: ScenarioFeedbackInput): Promise<ScenarioFeedbackOutput> {
    const provider = (this.configService.get<string>("AI_PROVIDER") ?? "mock").toLowerCase();
    if (provider !== "mock") {
      const result = await this.callLlmGateway(input);
      if (result) {
        return result;
      }
      this.logger.warn(`provider=${provider} unavailable, fallback to rule-based`);
    }
    return this.ruleBased(input);
  }

  private async callLlmGateway(
    input: ScenarioFeedbackInput
  ): Promise<ScenarioFeedbackOutput | null> {
    const prompt = buildScenarioPrompt(input.type, input.topic, input.userInput, input.grade);
    const parsed = await this.llmGatewayService.requestJsonObject(
      "You are a strict JSON generator.",
      prompt
    );
    if (!parsed) {
      return null;
    }

    if (
      typeof parsed.score !== "number" ||
      !parsed.feedback ||
      !parsed.correction ||
      !parsed.encouragement ||
      !parsed.nextAction
    ) {
      return null;
    }

    return {
      score: this.clampScore(parsed.score),
      feedback: String(parsed.feedback),
      correction: String(parsed.correction),
      encouragement: String(parsed.encouragement),
      nextAction: String(parsed.nextAction)
    };
  }

  private ruleBased(input: ScenarioFeedbackInput): ScenarioFeedbackOutput {
    const normalized = input.userInput.trim();
    const words = normalized.split(/\s+/).filter(Boolean);
    const lengthScore = Math.min(60, words.length * 6);
    const punctuationBonus = /[.!?]$/.test(normalized) ? 10 : 0;
    const topicBonus =
      input.topic && normalized.toLowerCase().includes(input.topic.toLowerCase()) ? 10 : 0;
    const base = 20;
    const score = this.clampScore(base + lengthScore + punctuationBonus + topicBonus);

    return {
      score,
      feedback: `Your response is understandable. Score ${score}/100.`,
      correction: this.makeCorrection(input.type, normalized),
      encouragement: "Good effort. Keep using full English sentences.",
      nextAction: this.nextAction(input.type, input.topic)
    };
  }

  private clampScore(value: number): number {
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value);
  }

  private makeCorrection(type: LearningType, input: string): string {
    if (!input) {
      return "Try answering with a complete sentence.";
    }
    if (type === LearningType.PRONUNCIATION) {
      return "Focus on stress and ending sounds when reading aloud.";
    }
    if (type === LearningType.SENTENCE_BUILDING) {
      return "Use subject + verb + object for clearer sentence structure.";
    }
    if (type === LearningType.READING) {
      return "Answer with key details from the passage.";
    }
    if (type === LearningType.ORAL_DIALOGUE) {
      return "Add one more follow-up sentence to keep the conversation going.";
    }
    return "Keep your answer concise and grammatically complete.";
  }

  private nextAction(type: LearningType, topic: string): string {
    if (type === LearningType.PRONUNCIATION) {
      return "Repeat the sentence 3 times with slower speed.";
    }
    if (type === LearningType.SENTENCE_BUILDING) {
      return `Create another sentence about ${topic || "today's topic"}.`;
    }
    if (type === LearningType.READING) {
      return "Summarize the paragraph in one sentence.";
    }
    if (type === LearningType.ORAL_DIALOGUE) {
      return "Ask one follow-up question in English.";
    }
    return "Continue to the next exercise.";
  }
}
