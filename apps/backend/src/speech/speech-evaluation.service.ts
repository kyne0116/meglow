import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  PronunciationEvaluationInput,
  PronunciationEvaluationOutput
} from "./types/pronunciation-evaluation";

@Injectable()
export class SpeechEvaluationService {
  private readonly logger = new Logger(SpeechEvaluationService.name);

  constructor(private readonly configService: ConfigService) {}

  async evaluatePronunciation(
    input: PronunciationEvaluationInput
  ): Promise<PronunciationEvaluationOutput> {
    const provider = (
      this.configService.get<string>("SPEECH_EVAL_PROVIDER") ?? "mock"
    ).toLowerCase();
    if (provider === "xunfei") {
      const result = await this.tryXunfei(input);
      if (result) {
        return result;
      }
    }
    return this.mockEvaluate(input);
  }

  private async tryXunfei(
    input: PronunciationEvaluationInput
  ): Promise<PronunciationEvaluationOutput | null> {
    const endpoint = this.configService.get<string>("XUNFEI_EVAL_ENDPOINT");
    if (!endpoint) {
      return null;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: input.audioUrl,
          transcript: input.transcript,
          expectedText: input.expectedText
        })
      });
      if (!response.ok) {
        return null;
      }
      const payload = (await response.json()) as Partial<PronunciationEvaluationOutput>;
      if (typeof payload.score !== "number") {
        return null;
      }
      return {
        provider: "xunfei",
        score: Math.max(0, Math.min(100, Math.round(payload.score))),
        feedback: payload.feedback ?? "Pronunciation evaluated by xunfei provider.",
        phonemeHints: Array.isArray(payload.phonemeHints) ? payload.phonemeHints.map(String) : []
      };
    } catch (error: unknown) {
      this.logger.warn(`xunfei provider failed, fallback to mock: ${String(error)}`);
      return null;
    }
  }

  private mockEvaluate(input: PronunciationEvaluationInput): PronunciationEvaluationOutput {
    const transcript = input.transcript.trim();
    const expected = (input.expectedText ?? "").trim();
    const lengthFactor = Math.min(40, transcript.split(/\s+/).filter(Boolean).length * 5);
    const matchBonus = expected && transcript.toLowerCase() === expected.toLowerCase() ? 25 : 0;
    const punctuationBonus = /[.!?]$/.test(transcript) ? 5 : 0;
    const score = Math.max(0, Math.min(100, 30 + lengthFactor + matchBonus + punctuationBonus));

    const feedback =
      score >= 85
        ? "Pronunciation is clear. Keep stable speed and stress."
        : "Need clearer stress and ending sounds. Slow down and repeat.";

    return {
      provider: "mock",
      score,
      feedback,
      phonemeHints:
        score >= 85
          ? ["Keep rhythm steady"]
          : ["Focus on vowel length", "Emphasize final consonants"]
    };
  }
}
