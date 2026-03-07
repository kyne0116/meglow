import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { BriefingModule } from "../briefing/briefing.module";
import { GamificationModule } from "../gamification/gamification.module";
import { SpeechModule } from "../speech/speech.module";
import { DialogueController } from "./dialogue.controller";
import { PronunciationController } from "./pronunciation.controller";
import { PronunciationService } from "./pronunciation.service";
import { ReadingController } from "./reading.controller";
import { ScenarioSessionService } from "./scenario-session.service";
import { SentenceController } from "./sentence.controller";
import { WordLearningController } from "./word-learning.controller";
import { WordLearningService } from "./word-learning.service";

@Module({
  imports: [AiModule, SpeechModule, BriefingModule, GamificationModule],
  controllers: [
    WordLearningController,
    PronunciationController,
    SentenceController,
    ReadingController,
    DialogueController
  ],
  providers: [WordLearningService, ScenarioSessionService, PronunciationService]
})
export class EnglishModule {}
