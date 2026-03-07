import { LearningType } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { SpeechEvaluationService } from "../speech/speech-evaluation.service";
import { StartScenarioSessionDto } from "./dto/start-scenario-session.dto";
import { SubmitPronunciationInputDto } from "./dto/submit-pronunciation-input.dto";
import { ScenarioSessionService } from "./scenario-session.service";

@Injectable()
export class PronunciationService {
  constructor(
    private readonly scenarioService: ScenarioSessionService,
    private readonly speechEvaluationService: SpeechEvaluationService
  ) {}

  async start(user: JwtPayload, dto: StartScenarioSessionDto) {
    return this.scenarioService.start(user, LearningType.PRONUNCIATION, dto);
  }

  async submit(user: JwtPayload, sessionId: string, dto: SubmitPronunciationInputDto) {
    const speech = await this.speechEvaluationService.evaluatePronunciation({
      audioUrl: dto.audioUrl,
      transcript: dto.input,
      expectedText: dto.expectedText
    });

    return this.scenarioService.submit(user, LearningType.PRONUNCIATION, sessionId, {
      input: dto.input,
      score: speech.score,
      feedback: `[${speech.provider}] ${speech.feedback}`
    });
  }

  async end(user: JwtPayload, sessionId: string) {
    return this.scenarioService.end(user, LearningType.PRONUNCIATION, sessionId);
  }

  async progress(user: JwtPayload, childId: string) {
    return this.scenarioService.progress(user, LearningType.PRONUNCIATION, childId);
  }
}
