import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminAuditModule } from './admin-audit/admin-audit.module';
import { AdminContentModule } from './admin-content/admin-content.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminOverviewModule } from './admin-overview/admin-overview.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { ChildSubjectBindingsModule } from './child-subject-bindings/child-subject-bindings.module';
import { ChildrenModule } from './children/children.module';
import { ContentModule } from './content/content.module';
import { ContentOpsModule } from './content-ops/content-ops.module';
import { validationSchemaForEnv } from './config/environment-variables';
import { FamilyModule } from './family/family.module';
import { HealthModule } from './health/health.module';
import { LearningModule } from './learning/learning.module';
import { PersistenceModule } from './persistence/persistence.module';
import { PushesModule } from './pushes/pushes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TextbooksModule } from './textbooks/textbooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchemaForEnv,
    }),
    PersistenceModule,
    HealthModule,
    AdminAuthModule,
    AdminAuditModule,
    AdminContentModule,
    AdminOverviewModule,
    AdminUsersModule,
    AuthModule,
    SubjectsModule,
    TextbooksModule,
    FamilyModule,
    ChildrenModule,
    ChildSubjectBindingsModule,
    ContentModule,
    ContentOpsModule,
    PushesModule,
    LearningModule,
  ],
})
export class AppModule {}
