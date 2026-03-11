import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [AuthModule, ContentModule],
  controllers: [LearningController],
  providers: [LearningService],
})
export class LearningModule {}
