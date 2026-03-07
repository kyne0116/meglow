import { Controller, Get, Post } from "@nestjs/common";
import { AiEvalService } from "./ai-eval.service";
import { ScenarioEvalCase } from "./scenario-eval.dataset";

@Controller("ai/evals")
export class AiEvalController {
  constructor(private readonly aiEvalService: AiEvalService) {}

  @Get("scenarios/cases")
  listCases(): ScenarioEvalCase[] {
    return this.aiEvalService.listCases();
  }

  @Post("scenarios/run")
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
    return this.aiEvalService.runScenarioEval();
  }
}
