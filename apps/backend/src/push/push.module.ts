import { Module } from "@nestjs/common";
import { NotificationModule } from "../notification/notification.module";
import { PushController } from "./push.controller";
import { PushSchedulerService } from "./scheduler/push-scheduler.service";
import { PushService } from "./push.service";

@Module({
  imports: [NotificationModule],
  controllers: [PushController],
  providers: [PushService, PushSchedulerService],
  exports: [PushService]
})
export class PushModule {}
