#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://ai_companion:ai_companion_dev@localhost:5432/ai_companion",
  MASTRA_DURABLE_REQUIRED: process.env.MASTRA_DURABLE_REQUIRED ?? "false"
};

const result = spawnSync("npm", ["run", "test:e2e", "--workspace", "@meglow/backend", "--", "--runInBand"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env
});

process.exit(result.status ?? 1);
