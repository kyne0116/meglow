import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { ContentModule } from './content/content.module';
import { validationSchemaForEnv } from './config/environment-variables';
import { FamilyModule } from './family/family.module';
import { HealthModule } from './health/health.module';
import { LearningModule } from './learning/learning.module';
import { PersistenceModule } from './persistence/persistence.module';
import { PushesModule } from './pushes/pushes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchemaForEnv,
    }),
    PersistenceModule,
    HealthModule,
    AuthModule,
    FamilyModule,
    ChildrenModule,
    ContentModule,
    PushesModule,
    LearningModule,
  ],
})
export class AppModule {}
