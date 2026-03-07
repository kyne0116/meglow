#!/usr/bin/env node

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".git")) {
  console.log("[husky] skip: no .git directory");
  process.exit(0);
}

const gitVersion = spawnSync("git", ["--version"], { stdio: "ignore", shell: true });
if (gitVersion.status !== 0) {
  console.log("[husky] skip: git command not found");
  process.exit(0);
}

const insideRepo = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
  stdio: "ignore",
  shell: true
});
if (insideRepo.status !== 0) {
  console.log("[husky] skip: not inside git work tree");
  process.exit(0);
}

const setHooksPath = spawnSync("git", ["config", "core.hooksPath", ".husky"], {
  stdio: "inherit",
  shell: true
});
if (setHooksPath.status !== 0) {
  process.exit(setHooksPath.status ?? 1);
}

console.log("[husky] hooksPath set to .husky");
