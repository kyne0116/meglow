import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const AUTO_START = "<!-- AUTO:START -->";
const AUTO_END = "<!-- AUTO:END -->";
const STATUS_FILE = path.join("docs", "04-implementation", "live-implementation-status.md");
const BACKEND_SRC = path.join("apps", "backend", "src");
const BACKEND_TEST = path.join("apps", "backend", "test");
const PRISMA_SCHEMA = path.join("apps", "backend", "prisma", "schema.prisma");

const mode = process.argv.includes("--check") ? "check" : "sync";

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function normalizeSegment(part) {
  if (!part || part === "/") return "";
  return part.replace(/^\/+|\/+$/g, "");
}

function joinApiPath(base, sub) {
  const a = normalizeSegment(base);
  const b = normalizeSegment(sub);
  if (!a && !b) return "/api";
  if (!a) return `/api/${b}`;
  if (!b) return `/api/${a}`;
  return `/api/${a}/${b}`;
}

async function listFilesRecursive(dir) {
  if (!existsSync(dir)) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFilesRecursive(full);
      return [full];
    })
  );
  return groups.flat();
}

function parseControllerEndpoints(content, relPath) {
  const baseMatch = content.match(/@Controller\("([^"]*)"\)/);
  if (!baseMatch) return [];

  const endpoints = [];
  const methodRegex = /@(Get|Post|Put|Patch|Delete)\("([^"]*)"\)/g;
  let match = methodRegex.exec(content);
  while (match) {
    endpoints.push({
      method: match[1].toUpperCase(),
      path: joinApiPath(baseMatch[1], match[2]),
      source: relPath
    });
    match = methodRegex.exec(content);
  }
  return endpoints;
}

function parsePrismaModels(schemaText) {
  const models = [];
  const modelRegex = /^model\s+([A-Za-z0-9_]+)/gm;
  let match = modelRegex.exec(schemaText);
  while (match) {
    models.push(match[1]);
    match = modelRegex.exec(schemaText);
  }
  return models;
}

function buildAutoBlock(payload) {
  const endpointRows = payload.endpoints
    .sort((a, b) => (a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path)))
    .map((ep) => `| ${ep.method} | ${ep.path} | ${ep.source} |`);

  return [
    `- Backend modules: ${payload.moduleNames.length}`,
    `- Controllers: ${payload.controllers.length}`,
    `- API endpoints: ${payload.endpoints.length}`,
    `- Prisma models: ${payload.prismaModels.length}`,
    `- E2E files: ${payload.e2eTests.length}`,
    `- Workspace note: ${payload.gitSummaryNote}`,
    "",
    "### Module List",
    ...payload.moduleNames.map((name) => `- ${name}`),
    "",
    "### Prisma Models",
    ...payload.prismaModels.map((name) => `- ${name}`),
    "",
    "### API Endpoints",
    "| Method | Path | Source |",
    "|---|---|---|",
    ...endpointRows
  ].join("\n");
}

async function generatePayload() {
  const srcFiles = await listFilesRecursive(BACKEND_SRC);
  const moduleFiles = srcFiles.filter((f) => f.endsWith(".module.ts"));
  const controllerFiles = srcFiles.filter((f) => f.endsWith(".controller.ts"));

  const endpoints = [];
  for (const file of controllerFiles) {
    const content = await fs.readFile(file, "utf8");
    endpoints.push(...parseControllerEndpoints(content, toPosix(path.relative(process.cwd(), file))));
  }

  const prismaModels = existsSync(PRISMA_SCHEMA)
    ? parsePrismaModels(await fs.readFile(PRISMA_SCHEMA, "utf8"))
    : [];

  const e2eTests = (await listFilesRecursive(BACKEND_TEST))
    .filter((f) => f.endsWith(".e2e-spec.ts"))
    .map((f) => toPosix(path.relative(process.cwd(), f)));

  return {
    moduleNames: moduleFiles.map((f) => path.basename(f, ".module.ts")).sort((a, b) => a.localeCompare(b)),
    controllers: controllerFiles.map((f) => toPosix(path.relative(process.cwd(), f))),
    endpoints,
    e2eTests,
    prismaModels,
    gitSummaryNote: "use `git status --short` in shell for git details"
  };
}

function ensureTemplate(existing) {
  if (existing.includes(AUTO_START) && existing.includes(AUTO_END)) return existing;

  return [
    "# Live Implementation Status",
    "",
    "> This file is maintained by `npm run status:sync`.",
    "",
    "- Last Synced: N/A",
    "",
    "## Auto Stats",
    AUTO_START,
    "",
    AUTO_END,
    "",
    "## Manual Notes",
    "### Current Goal",
    "- Keep docs and code status aligned",
    "",
    "### Blockers",
    "- None",
    "",
    "### Next Step",
    "1. Continue implementation and sync status"
  ].join("\n");
}

function replaceAutoBlock(content, autoBlock, nowIso) {
  const escapedStart = AUTO_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = AUTO_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "m");
  const replaced = content.replace(blockRegex, `${AUTO_START}\n${autoBlock}\n${AUTO_END}`);
  return replaced.replace(/- Last Synced: .*/g, `- Last Synced: ${nowIso}`);
}

async function main() {
  const payload = await generatePayload();
  const autoBlock = buildAutoBlock(payload);
  const nowIso = new Date().toISOString();

  const existing = existsSync(STATUS_FILE) ? await fs.readFile(STATUS_FILE, "utf8") : "";
  const withTemplate = ensureTemplate(existing);
  const expected = replaceAutoBlock(withTemplate, autoBlock, nowIso);

  if (mode === "check") {
    const currentAuto = withTemplate.match(new RegExp(`${AUTO_START}[\\s\\S]*${AUTO_END}`, "m"))?.[0] ?? "";
    const expectedAuto = expected.match(new RegExp(`${AUTO_START}[\\s\\S]*${AUTO_END}`, "m"))?.[0] ?? "";
    if (currentAuto !== expectedAuto) {
      console.error("status file is out of sync. run: npm run status:sync");
      process.exit(1);
    }
    console.log("status file is in sync");
    return;
  }

  await fs.mkdir(path.dirname(STATUS_FILE), { recursive: true });
  await fs.writeFile(STATUS_FILE, expected, "utf8");
  console.log(`status synced: ${STATUS_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
