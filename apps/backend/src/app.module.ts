import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { BriefingModule } from "./briefing/briefing.module";
import { ChildModule } from "./child/child.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { EnglishModule } from "./english/english.module";
import { FamilyModule } from "./family/family.module";
import { GamificationModule } from "./gamification/gamification.module";
import { HealthModule } from "./health/health.module";
import { NotificationModule } from "./notification/notification.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PushModule } from "./push/push.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    BriefingModule,
    FamilyModule,
    ChildModule,
    GamificationModule,
    NotificationModule,
    PushModule,
    EnglishModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
