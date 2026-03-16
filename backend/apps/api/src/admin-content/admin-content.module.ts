import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getRuntimeJwtSecret } from '../config/runtime-config';
import { PersistenceModule } from '../persistence/persistence.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { AdminContentController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';

@Module({
  imports: [
    PersistenceModule,
    SubjectsModule,
    JwtModule.register({
      secret: getRuntimeJwtSecret(),
    }),
  ],
  controllers: [AdminContentController],
  providers: [AdminContentService],
})
export class AdminContentModule {}
