import { Module } from '@nestjs/common';
import { SubjectsModule } from '../subjects/subjects.module';
import { TextbooksController } from './textbooks.controller';
import { TextbooksService } from './textbooks.service';

@Module({
  imports: [SubjectsModule],
  controllers: [TextbooksController],
  providers: [TextbooksService],
  exports: [TextbooksService],
})
export class TextbooksModule {}
