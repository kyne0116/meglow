import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    const prismaClient = this as unknown as {
      $on(event: string, callback: () => Promise<void>): void;
    };
    prismaClient.$on("beforeExit", async () => {
      await app.close();
    });
  }
}
