import { Injectable } from "@nestjs/common";
import { AiTutorService } from "../ai-tutor.service";
import { ScenarioEvalCase, scenarioEvalDataset } from "./scenario-eval.dataset";

@Injectable()
export class AiEvalService {
  constructor(private readonly aiTutorService: AiTutorService) {}

  listCases(): ScenarioEvalCase[] {
    return scenarioEvalDataset;
  }

  async runScenarioEval(): Promise<{
    total: number;
    passed: number;
    passRate: number;
    results: Array<{
      id: string;
      score: number;
      passed: boolean;
      feedback: string;
      correction: string;
      nextAction: string;
    }>;
  }> {
    const results: Array<{
      id: string;
      score: number;
      passed: boolean;
      feedback: string;
      correction: string;
      nextAction: string;
    }> = [];

    for (const item of scenarioEvalDataset) {
      const output = await this.aiTutorService.evaluateScenario(item.input);
      const normalizedText =
        `${output.feedback} ${output.correction} ${output.nextAction}`.toLowerCase();
      const containsAll = item.mustContain.every((key) =>
        normalizedText.includes(key.toLowerCase())
      );
      const passed = output.score >= item.minScore && containsAll;
      results.push({
        id: item.id,
        score: output.score,
        passed,
        feedback: output.feedback,
        correction: output.correction,
        nextAction: output.nextAction
      });
    }

    const total = results.length;
    const passed = results.filter((item) => item.passed).length;
    const passRate = total === 0 ? 0 : Number(((passed / total) * 100).toFixed(2));

    return { total, passed, passRate, results };
  }
}
