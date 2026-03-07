import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { parentApprovalWorkflow } from "./parent-approval.workflow";

@Injectable()
export class MastraWorkflowRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MastraWorkflowRuntimeService.name);

  private storage?: any;
  private workflow = parentApprovalWorkflow;
  private durableEnabled = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const connectionString = this.configService.get<string>("DATABASE_URL");
    if (!connectionString) {
      this.logger.warn("DATABASE_URL is empty, mastra postgres storage disabled");
      return;
    }

    try {
      const [{ Mastra }, { PostgresStore }] = await Promise.all([
        this.importEsmModule<typeof import("@mastra/core/mastra")>("@mastra/core/mastra"),
        this.importEsmModule<typeof import("@mastra/pg")>("@mastra/pg")
      ]);

      const storage = new PostgresStore({
        id: "meglow-mastra-storage",
        connectionString,
        schemaName: this.configService.get<string>("MASTRA_PG_SCHEMA") ?? "mastra"
      });
      await storage.init();
      this.storage = storage;

      const mastra = new Mastra({
        storage,
        workflows: {
          parentApprovalWorkflow: this.workflow
        }
      });
      this.workflow = mastra.getWorkflow("parentApprovalWorkflow");
      this.durableEnabled = true;
      this.logger.log("mastra postgres storage enabled");
    } catch (error: unknown) {
      this.durableEnabled = false;
      this.logger.warn(`mastra postgres storage init failed: ${String(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.storage) {
      return;
    }
    await this.storage.close();
    this.storage = undefined;
  }

  getWorkflow(): typeof parentApprovalWorkflow {
    return this.workflow;
  }

  isDurableEnabled(): boolean {
    return this.durableEnabled;
  }

  private async importEsmModule<T>(specifier: string): Promise<T> {
    const dynamicImporter = new Function("s", "return import(s)") as (s: string) => Promise<T>;
    return dynamicImporter(specifier);
  }
}
