import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getRuntimeDatabaseUrl } from '../../config/runtime-config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    if (!getRuntimeDatabaseUrl()) {
      this.logger.warn(
        'DATABASE_URL is not set. Prisma connection is skipped for the current run.',
      );
      return;
    }

    await this.$connect();
  }
}
