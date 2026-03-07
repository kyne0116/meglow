import { Module } from "@nestjs/common";
import { NotificationModule } from "../notification/notification.module";
import { BriefingController } from "./briefing.controller";
import { BriefingService } from "./briefing.service";

@Module({
  imports: [NotificationModule],
  controllers: [BriefingController],
  providers: [BriefingService],
  exports: [BriefingService]
})
export class BriefingModule {}
