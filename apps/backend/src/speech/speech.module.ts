import { Module } from "@nestjs/common";
import { SpeechEvaluationService } from "./speech-evaluation.service";

@Module({
  providers: [SpeechEvaluationService],
  exports: [SpeechEvaluationService]
})
export class SpeechModule {}
