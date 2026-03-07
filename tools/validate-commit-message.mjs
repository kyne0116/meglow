#!/usr/bin/env node

import fs from "node:fs";

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  console.error("[commit-msg] missing commit message file path");
  process.exit(1);
}

const raw = fs.readFileSync(commitMsgFile, "utf8");
const firstLine = raw
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.length > 0);

if (!firstLine) {
  console.error("[commit-msg] empty commit message");
  process.exit(1);
}

// Allow common git-generated commit messages.
const exemptPatterns = [/^Merge /, /^Revert "/, /^fixup! /, /^squash! /];
if (exemptPatterns.some((pattern) => pattern.test(firstLine))) {
  process.exit(0);
}

const conventionalCommitPattern =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9._/-]+\))?(!)?: .+$/;

if (!conventionalCommitPattern.test(firstLine)) {
  console.error("[commit-msg] invalid format");
  console.error(
    "[commit-msg] expected: <type>(<scope>): <subject>, e.g. feat(backend): add llm provider fallback"
  );
  process.exit(1);
}

if (firstLine.length > 100) {
  console.error(`[commit-msg] first line too long (${firstLine.length}/100)`);
  process.exit(1);
}

