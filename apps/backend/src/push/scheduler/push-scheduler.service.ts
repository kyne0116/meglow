import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { PushService } from "../push.service";

@Injectable()
export class PushSchedulerService {
  private readonly logger = new Logger(PushSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService
  ) {}

  @Cron("0 * * * *")
  async runHourly(): Promise<void> {
    const families = await this.prisma.family.findMany({
      select: { id: true }
    });

    let created = 0;
    let skipped = 0;
    for (const family of families) {
      const result = await this.pushService.runSchedulerForFamilyId(family.id);
      created += result.created;
      skipped += result.skipped;
    }

    this.logger.log(
      `push scheduler completed: families=${families.length} created=${created} skipped=${skipped}`
    );
  }

  @Cron("*/5 * * * *")
  async runDeliveryEveryFiveMinutes(): Promise<void> {
    const families = await this.prisma.family.findMany({
      select: { id: true }
    });

    let delivered = 0;
    let skipped = 0;
    for (const family of families) {
      const result = await this.pushService.runAutoDeliveryForFamilyId(family.id);
      delivered += result.delivered;
      skipped += result.skipped;
    }

    this.logger.log(
      `push delivery scheduler completed: families=${families.length} delivered=${delivered} skipped=${skipped}`
    );
  }

  @Cron("*/10 * * * *")
  async runPostponedRequeueEveryTenMinutes(): Promise<void> {
    const families = await this.prisma.family.findMany({
      select: { id: true }
    });

    let requeued = 0;
    let skipped = 0;
    for (const family of families) {
      const result = await this.pushService.runPostponedRequeueForFamilyId(family.id);
      requeued += result.requeued;
      skipped += result.skipped;
    }

    this.logger.log(
      `push postponed requeue completed: families=${families.length} requeued=${requeued} skipped=${skipped}`
    );
  }

  @Cron("*/15 * * * *")
  async runExpirationEveryFifteenMinutes(): Promise<void> {
    const families = await this.prisma.family.findMany({
      select: { id: true }
    });

    let expired = 0;
    let skipped = 0;
    for (const family of families) {
      const result = await this.pushService.runExpirationForFamilyId(family.id);
      expired += result.expired;
      skipped += result.skipped;
    }

    this.logger.log(
      `push expiration completed: families=${families.length} expired=${expired} skipped=${skipped}`
    );
  }
}
