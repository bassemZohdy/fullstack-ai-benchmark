#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  parseArgs,
  boolValue,
  requireValue,
  LEVELS,
  BACKENDS,
  FRONTENDS,
  HARNESSES,
  PROVIDERS,
  repoRoot,
  workspaceDir,
  resolveRepoPath,
  ensureFile,
  ensureInside,
  resolveHarnessCli,
  mapHarnessProvider,
  mapHarnessModel,
  formatHarnessModel,
  renderPrompt,
  countGeneratedFiles,
  spawnStreaming,
  monitorProcessWithActivity,
  runCommand,
  parseJsonSafe,
  writeJson,
  readJson
} = require("../../_shared/lib/benchmark");

function sessionBaseName(harness) {
  switch (harness) {
    case "pi": return ".pi-session";
    case "mimo-code": return ".mimo-session";
    case "claude": return ".claude-session";
    case "codex": return ".codex-session";
    default: return ".opencode-session";
  }
}

function buildGenerationCommand(ctx, renderedPromptFile, sessionId) {
  const genPrompt = "Generate the complete full-stack project described in the attached rendered specification file. Write all files directly into the current working directory and then stop.";

  switch (ctx.harness) {
    case "opencode": {
      const args = [
        "run",
        "--model", ctx.harnessModel,
        "--file", renderedPromptFile,
        "--dir", ctx.outputDirAbs,
        "--title", `benchmark ${ctx.model} ${ctx.backend}-${ctx.frontend} ${ctx.level}`
      ];
      if (ctx.autoApprove) args.push("--dangerously-skip-permissions");
      if (sessionId) args.push("--session", sessionId);
      args.push(genPrompt);
      return { command: ctx.harnessCli, args, cwd: repoRoot };
    }
    case "pi": {
      return {
        command: ctx.harnessCli,
        args: ["--provider", ctx.harnessProvider, "--model", ctx.harnessModelId, "--no-context-files", "-p", `@${renderedPromptFile}`],
        cwd: ctx.outputDirAbs
      };
    }
    case "mimo-code": {
      const args = ["run", "-m", ctx.harnessModel, "--dir", ctx.outputDirAbs, "--file", renderedPromptFile, "--title", `benchmark ${ctx.model} ${ctx.backend}-${ctx.frontend} ${ctx.level}`];
      if (ctx.autoApprove) args.push("--dangerously-skip-permissions");
      if (sessionId) args.push("-s", sessionId);
      args.push(genPrompt);
      return { command: ctx.harnessCli, args, cwd: repoRoot };
    }
    case "claude": {
      const fullPrompt = `${fs.readFileSync(renderedPromptFile, "utf8")}\n\n${genPrompt}`;
      const args = ["--print", "--model", ctx.harnessModelId, "--dangerously-skip-permissions", "--safe-mode", fullPrompt];
      if (sessionId) args.push("--resume", sessionId);
      return { command: ctx.harnessCli, args, cwd: ctx.outputDirAbs };
    }
    case "codex": {
      const fullPrompt = [
        "IMPORTANT: This is a code generation benchmark task. Start writing code files to disk immediately. Do not use image generation, browser tools, or design review workflows.",
        fs.readFileSync(renderedPromptFile, "utf8"),
        genPrompt
      ].join("\n\n");
      return {
        command: ctx.harnessCli,
        args: ["exec", "-C", ctx.outputDirAbs, "-m", ctx.harnessModelId, "--dangerously-bypass-approvals-and-sandbox", "--skip-git-repo-check", fullPrompt],
        cwd: repoRoot
      };
    }
    case "kilo-code":
      throw new Error("harness kilo-code is scaffolded and not yet implemented");
    default:
      throw new Error(`Unknown harness: ${ctx.harness}`);
  }
}

function captureLatestSessionId(ctx) {
  if (ctx.harness === "opencode") {
    const result = runCommand(ctx.harnessCli, ["session", "list", "--format", "json", "--max-count", "1"], {
      stdio: "pipe",
      encoding: "utf8"
    });
    const data = parseJsonSafe(result.stdout || "[]", []);
    const first = Array.isArray(data) ? data[0] : data;
    return first && (first.id || first.sessionID || first.sessionId) || "";
  }
  if (ctx.harness === "mimo-code") {
    const result = runCommand(ctx.harnessCli, ["session", "list", "--format", "json", "-n", "1"], {
      stdio: "pipe",
      encoding: "utf8"
    });
    const data = parseJsonSafe(result.stdout || "[]", []);
    const first = Array.isArray(data) ? data[0] : data;
    return first && (first.id || first.sessionID || first.sessionId) || "";
  }
  return "";
}

function captureSessionExport(ctx, sessionId) {
  if (!sessionId) return null;
  if (ctx.harness !== "opencode" && ctx.harness !== "mimo-code") return null;
  const result = runCommand(ctx.harnessCli, ["export", sessionId], { stdio: "pipe", encoding: "utf8" });
  if (result.status !== 0) return null;
  return parseJsonSafe(result.stdout, null);
}

function appendSessionRecord(recordFile, attemptRecord) {
  const record = readJson(recordFile, { metadata: {}, latest_session_id: null, latest_attempt: null, attempts: [] });
  record.latest_session_id = attemptRecord.latest_session_id || null;
  record.latest_attempt = attemptRecord;
  record.attempts = Array.isArray(record.attempts) ? record.attempts : [];
  record.attempts.push(attemptRecord);
  writeJson(recordFile, record);
}

async function runAttempt(ctx, renderedPromptFile, sessionId) {
  const built = buildGenerationCommand(ctx, renderedPromptFile, sessionId);
  const child = spawnStreaming(built.command, built.args, { cwd: built.cwd });
  const inactivity = Number(ctx.inactivityTimeout || (["mimo-code", "pi"].includes(ctx.harness) ? 180 : 120));
  return monitorProcessWithActivity(child, ctx.outputDirAbs, Number(ctx.timeout), inactivity);
}

async function main() {
  const raw = parseArgs(process.argv.slice(2));
  const ctx = {
    model: raw.model,
    level: raw.level,
    backend: raw.backend,
    frontend: raw.frontend,
    harness: raw.harness || "opencode",
    provider: raw.provider || "z-ai",
    timeout: raw.timeout || "600",
    inactivityTimeout: raw.inactivityTimeout || "",
    retries: Number(raw.retries || 3),
    autoApprove: raw.autoApprove === undefined ? true : boolValue(raw.autoApprove),
    dryRun: boolValue(raw.dryRun),
    template: raw.template || "PROMPTS/templates/project-generation.md",
    specFile: raw.specFile || `PROMPTS/${raw.level}.md`
  };

  if (!ctx.model || !ctx.level || !ctx.backend || !ctx.frontend) {
    throw new Error("--model, --level, --backend, and --frontend are required");
  }

  requireValue("level", ctx.level, LEVELS);
  requireValue("backend", ctx.backend, BACKENDS);
  requireValue("frontend", ctx.frontend, FRONTENDS);
  requireValue("harness", ctx.harness, HARNESSES);
  requireValue("provider", ctx.provider, PROVIDERS);
  if (ctx.provider === "openrouter" && !process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required for openrouter provider");
  }
  if (!Number.isInteger(ctx.retries) || ctx.retries < 1) {
    throw new Error("--retries must be a positive integer");
  }

  ctx.backendCartridge = `PROMPTS/cartridges/backend/${ctx.backend}.md`;
  ctx.frontendCartridge = `PROMPTS/cartridges/frontend/${ctx.frontend}.md`;
  ensureFile(ctx.template, "Prompt template");
  ensureFile(ctx.specFile, "Specification");
  ensureFile(ctx.backendCartridge, "Backend cartridge");
  ensureFile(ctx.frontendCartridge, "Frontend cartridge");

  ctx.outputDir = raw.outputDir || workspaceDir(ctx);
  ctx.outputDirAbs = ensureInside(ctx.outputDir, "WORKSPACE", "Output directory");
  fs.mkdirSync(ctx.outputDirAbs, { recursive: true });

  ctx.harnessProvider = mapHarnessProvider(ctx.harness, ctx.provider);
  ctx.harnessModelId = mapHarnessModel(ctx.harnessProvider, ctx.model);
  ctx.harnessModel = formatHarnessModel(ctx.harnessProvider, ctx.harnessModelId);
  ctx.harnessCli = resolveHarnessCli(ctx.harness);
  if (!ctx.dryRun && !ctx.harnessCli) {
    throw new Error(`CLI not found for harness: ${ctx.harness}`);
  }
  if (ctx.dryRun && !ctx.harnessCli) {
    ctx.harnessCli = ctx.harness;
  }

  const baseSession = sessionBaseName(ctx.harness);
  const sessionFile = raw.sessionFile || path.join(ctx.outputDirAbs, `${baseSession}-id`);
  const recordFile = raw.sessionRecordFile || path.join(ctx.outputDirAbs, baseSession);
  let sessionId = raw.sessionId || "";
  if (!sessionId && fs.existsSync(sessionFile)) {
    sessionId = fs.readFileSync(sessionFile, "utf8").trim();
  }

  const renderedPromptFile = path.join(osTmpDir(), `benchmark-ai-prompt-${process.pid}-${Date.now()}.md`);
  renderPrompt({
    template: ctx.template,
    specFile: ctx.specFile,
    backendCartridge: ctx.backendCartridge,
    frontendCartridge: ctx.frontendCartridge,
    level: ctx.level,
    backend: ctx.backend,
    frontend: ctx.frontend,
    output: renderedPromptFile
  });

  const dryCommand = buildGenerationCommand(ctx, renderedPromptFile, sessionId);
  if (ctx.dryRun) {
    console.log("[project-generation] DRY RUN");
    console.log([dryCommand.command, ...dryCommand.args].join(" "));
    return;
  }

  for (const entry of fs.readdirSync(ctx.outputDirAbs)) {
    fs.rmSync(path.join(ctx.outputDirAbs, entry), { recursive: true, force: true });
  }

  writeJson(recordFile, {
    metadata: {
      model: ctx.model,
      provider: ctx.provider,
      harness: ctx.harness,
      harness_model: ctx.harnessModel,
      harness_provider: ctx.harnessProvider,
      level: ctx.level,
      backend: ctx.backend,
      frontend: ctx.frontend,
      output_dir: ctx.outputDirAbs,
      timeout_seconds: Number(ctx.timeout),
      retries: ctx.retries,
      started_at: new Date().toISOString()
    },
    latest_session_id: null,
    latest_attempt: null,
    attempts: []
  });

  let ok = false;
  for (let attempt = 1; attempt <= ctx.retries; attempt += 1) {
    const startedAt = new Date();
    const requestedSessionId = sessionId;
    console.log(`[project-generation] attempt ${attempt}/${ctx.retries}`);
    const result = await runAttempt(ctx, renderedPromptFile, sessionId);
    const endedAt = new Date();

    const latestSession = captureLatestSessionId(ctx) || sessionId;
    if (latestSession) {
      sessionId = latestSession;
      fs.writeFileSync(sessionFile, `${sessionId}\n`);
    }
    const exported = captureSessionExport(ctx, sessionId);
    const info = exported && exported.info || {};
    const tokens = info.tokens || {};
    const summary = info.summary || {};
    const elapsedSeconds = Math.round((endedAt - startedAt) / 1000);
    const status = result.code === 0 && countGeneratedFiles(ctx.outputDirAbs) > 0 ? "success" : "failed";

    appendSessionRecord(recordFile, {
      attempt,
      status,
      requested_session_id: requestedSessionId || null,
      latest_session_id: sessionId || null,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      elapsed_seconds: elapsedSeconds,
      title: info.title || null,
      directory: info.directory || ctx.outputDirAbs,
      model: info.model?.id || ctx.harnessModel,
      provider: info.model?.providerID || null,
      version: info.version || null,
      cost_usd: typeof info.cost === "number" ? info.cost : null,
      tokens: {
        input: typeof tokens.input === "number" ? tokens.input : null,
        output: typeof tokens.output === "number" ? tokens.output : null,
        reasoning: typeof tokens.reasoning === "number" ? tokens.reasoning : null,
        total: typeof tokens.total === "number" ? tokens.total : null
      },
      summary: {
        additions: typeof summary.additions === "number" ? summary.additions : null,
        deletions: typeof summary.deletions === "number" ? summary.deletions : null,
        files: typeof summary.files === "number" ? summary.files : null
      },
      export_available: Boolean(exported)
    });

    if (status === "success") {
      ok = true;
      break;
    }
    if (attempt < ctx.retries) {
      console.error("[project-generation] generation attempt failed; retrying");
    }
  }

  try {
    fs.rmSync(renderedPromptFile, { force: true });
  } catch {}

  if (!ok) {
    throw new Error(`Generation failed after ${ctx.retries} attempt(s)`);
  }
  console.log(`[project-generation] generated ${countGeneratedFiles(ctx.outputDirAbs)} files in ${ctx.outputDir}`);
}

function osTmpDir() {
  return process.env.TMPDIR || process.env.TMP || process.env.TEMP || "/tmp";
}

main().catch((error) => {
  console.error(`[project-generation] ERROR: ${error.message}`);
  process.exit(1);
});
