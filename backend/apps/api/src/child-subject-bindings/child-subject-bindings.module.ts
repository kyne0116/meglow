import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { ChildSubjectBindingsController } from './child-subject-bindings.controller';
import { ChildSubjectBindingsService } from './child-subject-bindings.service';

@Module({
  imports: [AuthModule, SubjectsModule],
  controllers: [ChildSubjectBindingsController],
  providers: [ChildSubjectBindingsService],
})
export class ChildSubjectBindingsModule {}
