#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://ai_companion:ai_companion_dev@localhost:5432/ai_companion"
};

const result =
  process.platform === "win32"
    ? spawnSync(
        "cmd",
        [
          "/d",
          "/s",
          "/c",
          `set DATABASE_URL=${env.DATABASE_URL}&& npx prisma db push --schema apps/backend/prisma/schema.prisma`
        ],
        {
          stdio: "inherit",
          env
        }
      )
    : spawnSync("npx", ["prisma", "db", "push", "--schema", "apps/backend/prisma/schema.prisma"], {
        stdio: "inherit",
        env
      });

process.exit(result.status ?? 1);
