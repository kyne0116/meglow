import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { PushesController } from './pushes.controller';
import { PushesService } from './pushes.service';

@Module({
  imports: [AuthModule, ContentModule],
  controllers: [PushesController],
  providers: [PushesService],
})
export class PushesModule {}
