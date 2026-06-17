#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const skillsRoot = path.join(repoRoot, "skills");

const LEVELS = ["overview", "detailed"];
const BACKENDS = ["node-js", "spring-boot", "quarkus"];
const FRONTENDS = ["react", "angular"];
const HARNESSES = ["opencode", "pi", "claude", "codex", "kilo-code", "mimo-code"];
const PROVIDERS = ["z-ai", "zai-coding-plan", "zai-coding-cn", "openrouter", "mimo", "openai", "anthropic"];

function usage() {
  console.log(`Usage:
  node harness/benchmark-harness.js list
  node harness/benchmark-harness.js validate
  node harness/benchmark-harness.js plan --workflow benchmark --model <model> --level <level> --backend <backend> --frontend <frontend>
  node harness/benchmark-harness.js run --workflow benchmark --model <model> --level <level> --backend <backend> --frontend <frontend> [options]
  node harness/benchmark-harness.js run-skill --skill <name> [inputs]

Workflows:
  benchmark          reset? -> generation? -> static/full evaluation?
  generate           project generation only
  evaluate           static or full evaluation based on --skip-e2e
  render-prompt      prompt rendering only

Common inputs:
  --model <id> --level overview|detailed --backend node-js|spring-boot|quarkus --frontend react|angular
  --harness <name> --provider <name> --reset --skip-gen --skip-eval --skip-e2e --quiet
`);
}

function toCamel(name) {
  return name.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }
    const rawKey = arg.slice(2);
    const key = toCamel(rawKey);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function boolValue(value) {
  return value === true || value === "true" || value === "1" || value === "yes";
}

function slugifyModel(harness, model) {
  const modelSlug = String(model)
    .toLowerCase()
    .replace(/^glm-([0-9.]+)z\.ai$/, "glm-$1")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${harness}-${modelSlug}`;
}

function deriveContext(inputs) {
  const ctx = { ...inputs };
  ctx.harness = ctx.harness || "opencode";
  ctx.provider = ctx.provider || "z-ai";
  ctx.autoApprove = ctx.autoApprove === undefined ? "true" : String(ctx.autoApprove);
  ctx.retries = ctx.retries || "3";
  ctx.timeout = ctx.timeout || "600";
  ctx.healthTimeout = ctx.healthTimeout || "120000";
  ctx.buildTimeout = ctx.buildTimeout || "900000";
  ctx.composeTimeout = ctx.composeTimeout || "120000";
  ctx.template = ctx.template || "PROMPTS/templates/project-generation.md";
  ctx.specFile = ctx.specFile || (ctx.level ? `PROMPTS/${ctx.level}.md` : "");
  ctx.backendCartridge = ctx.backend ? `PROMPTS/cartridges/backend/${ctx.backend}.md` : "";
  ctx.frontendCartridge = ctx.frontend ? `PROMPTS/cartridges/frontend/${ctx.frontend}.md` : "";
  ctx.modelSlug = ctx.model ? slugifyModel(ctx.harness, ctx.model) : "";
  ctx.outputDir = ctx.outputDir || (ctx.model && ctx.level ? `WORKSPACE/${ctx.modelSlug}/${ctx.level}` : "");
  ctx.projectDir = ctx.projectDir || ctx.outputDir;
  ctx.resultsDir = ctx.resultsDir || (ctx.model && ctx.backend && ctx.frontend && ctx.level
    ? `RESULTS/${ctx.modelSlug}/${ctx.backend}-${ctx.frontend}/${ctx.level}`
    : "");
  ctx.resultsFile = ctx.resultsFile || (ctx.resultsDir ? `${ctx.resultsDir}/evaluation-results.json` : "");
  ctx.staticResultsFile = ctx.staticResultsFile || (ctx.resultsDir ? `${ctx.resultsDir}/static-evaluation.json` : "");
  ctx.e2eResultsFile = ctx.e2eResultsFile || (ctx.resultsDir ? `${ctx.resultsDir}/e2e-execution.json` : "");
  ctx.scope = ctx.scope || "all";
  ctx.quiet = boolValue(ctx.quiet);
  ctx.reset = boolValue(ctx.reset);
  ctx.skipGen = boolValue(ctx.skipGen);
  ctx.skipEval = boolValue(ctx.skipEval);
  ctx.skipE2e = boolValue(ctx.skipE2e);
  ctx.keepTestFiles = boolValue(ctx.keepTestFiles);
  ctx.dryRun = boolValue(ctx.dryRun);
  ctx.harnessLogDir = ctx.harnessLogDir || "logs/harness";
  return ctx;
}

function loadSkills() {
  if (!fs.existsSync(skillsRoot)) {
    return new Map();
  }
  const skills = new Map();
  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const contractPath = path.join(skillsRoot, entry.name, "skill.json");
    if (!fs.existsSync(contractPath)) continue;
    const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    contract.__dir = path.dirname(contractPath);
    contract.__path = contractPath;
    skills.set(contract.name, contract);
  }
  return skills;
}

function validateSkillContract(skill) {
  const required = [
    "schemaVersion",
    "name",
    "description",
    "supportedPlatforms",
    "supportedEnvironments",
    "requiredInputs",
    "prechecks",
    "execution",
    "expectedOutputs",
    "failureHandling",
    "recovery",
    "validation"
  ];
  const missing = required.filter((field) => skill[field] === undefined);
  if (missing.length > 0) {
    throw new Error(`${skill.__path || skill.name} missing required fields: ${missing.join(", ")}`);
  }
  if (!Array.isArray(skill.execution) || skill.execution.length === 0) {
    throw new Error(`${skill.name} must define at least one execution step`);
  }
  for (const step of skill.execution) {
    if (!step.command && !step.builtin) {
      throw new Error(`${skill.name} step "${step.name}" must define command or builtin`);
    }
  }
}

function subst(value, ctx) {
  return String(value).replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const resolved = ctx[key];
    return resolved === undefined || resolved === null ? "" : String(resolved);
  });
}

function resolveRepoPath(value, ctx) {
  const replaced = subst(value, ctx);
  if (path.isAbsolute(replaced)) {
    return replaced;
  }
  return path.join(repoRoot, replaced);
}

function conditionMatches(condition, ctx) {
  if (!condition) return true;
  const actual = ctx[condition.name];
  if (typeof condition.value === "boolean") {
    return boolValue(actual) === condition.value;
  }
  return String(actual) === String(condition.value);
}

function commandAvailable(command) {
  if (resolveExecutable(command)) {
    return true;
  }
  const probe = os.platform() === "win32" ? "where" : "command";
  const args = os.platform() === "win32" ? [command] : ["-v", command];
  const result = spawnSync(probe, args, { stdio: "ignore", shell: false });
  return result.status === 0;
}

function resolveExecutable(command) {
  if (command !== "bash") {
    return "";
  }

  const candidates = [
    process.env.BENCHMARK_BASH,
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    "bash"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (os.platform() !== "win32") {
    const result = spawnSync("command", ["-v", "bash"], { encoding: "utf8", shell: false });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  }

  return "";
}

function runtimeSupported(ctx) {
  return ["spring-boot", "node-js"].includes(ctx.backend) && ["angular", "react"].includes(ctx.frontend);
}

function runCheck(check, ctx, phase) {
  if (!conditionMatches(check.whenInputEquals, ctx)) {
    return { ok: true, skipped: true, description: check.description };
  }

  switch (check.type) {
    case "input-required": {
      const value = ctx[check.name];
      return {
        ok: value !== undefined && value !== null && value !== "",
        description: check.description,
        detail: check.name
      };
    }
    case "input-enum": {
      return {
        ok: Array.isArray(check.values) && check.values.map(String).includes(String(ctx[check.name])),
        description: check.description,
        detail: `${check.name}=${ctx[check.name]}`
      };
    }
    case "file-exists": {
      const filePath = resolveRepoPath(check.path, ctx);
      return { ok: fs.existsSync(filePath) && fs.statSync(filePath).isFile(), description: check.description, detail: filePath };
    }
    case "dir-exists": {
      const dirPath = resolveRepoPath(check.path, ctx);
      return { ok: fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(), description: check.description, detail: dirPath };
    }
    case "command-available": {
      return { ok: commandAvailable(subst(check.command, ctx)), description: check.description, detail: check.command };
    }
    case "env-set": {
      return { ok: Boolean(process.env[check.name]), description: check.description, detail: check.name };
    }
    case "runtime-supported": {
      return { ok: runtimeSupported(ctx), description: check.description, detail: `${ctx.backend}+${ctx.frontend}` };
    }
    case "path-inside": {
      const target = path.resolve(resolveRepoPath(check.path, ctx));
      const root = path.resolve(resolveRepoPath(check.root, ctx));
      return { ok: target === root || target.startsWith(root + path.sep), description: check.description, detail: target };
    }
    default:
      return { ok: false, description: check.description, detail: `Unknown ${phase} check type: ${check.type}` };
  }
}

function checkSkill(skill, ctx, phase) {
  const checks = phase === "validation" ? skill.validation : skill.prechecks;
  for (const check of checks || []) {
    const result = runCheck(check, ctx, phase);
    if (!result.ok) {
      throw new Error(`${skill.name} ${phase} failed: ${result.description}${result.detail ? ` (${result.detail})` : ""}`);
    }
  }
}

function buildCommand(step, ctx) {
  const command = [...step.command];
  for (const optional of step.optionalArgs || []) {
    const value = ctx[optional.input];
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      command.push(...optional.args);
    }
  }
  return command.map((part) => subst(part, ctx)).filter((part) => part !== "");
}

function runBuiltin(step, skill, ctx, logger) {
  logger.log({ event: "builtin_start", skill: skill.name, step: step.name, builtin: step.builtin });

  if (step.builtin === "renderPrompt") {
    const template = fs.readFileSync(resolveRepoPath(ctx.template, ctx), "utf8");
    const replacements = {
      "{{LEVEL}}": ctx.level,
      "{{BACKEND}}": ctx.backend,
      "{{FRONTEND}}": ctx.frontend,
      "{{SPEC_CONTENT}}": fs.readFileSync(resolveRepoPath(ctx.specFile, ctx), "utf8"),
      "{{BACKEND_CARTRIDGE}}": fs.readFileSync(resolveRepoPath(ctx.backendCartridge, ctx), "utf8"),
      "{{FRONTEND_CARTRIDGE}}": fs.readFileSync(resolveRepoPath(ctx.frontendCartridge, ctx), "utf8")
    };
    let rendered = template;
    for (const [token, value] of Object.entries(replacements)) {
      rendered = rendered.split(token).join(value);
    }
    if (ctx.output) {
      const outputPath = path.isAbsolute(ctx.output) ? ctx.output : path.join(repoRoot, ctx.output);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, rendered);
    } else {
      process.stdout.write(rendered);
    }
    logger.log({ event: "builtin_end", skill: skill.name, step: step.name, status: 0 });
    return 0;
  }

  if (step.builtin === "cleanupBenchmark") {
    const targets = [];
    if (ctx.scope === "workspace" || ctx.scope === "all") {
      targets.push(resolveRepoPath(ctx.outputDir, ctx));
    }
    if (ctx.scope === "results" || ctx.scope === "all") {
      targets.push(resolveRepoPath(ctx.resultsDir, ctx));
    }
    for (const target of targets) {
      const resolved = path.resolve(target);
      const workspaceRoot = path.resolve(path.join(repoRoot, "WORKSPACE"));
      const resultsRoot = path.resolve(path.join(repoRoot, "RESULTS"));
      const safe = resolved.startsWith(workspaceRoot + path.sep) || resolved.startsWith(resultsRoot + path.sep);
      if (!safe) {
        throw new Error(`Refusing to clean unsafe path: ${resolved}`);
      }
      if (fs.existsSync(resolved)) {
        fs.rmSync(resolved, { recursive: true, force: true });
        if (!ctx.quiet) console.log(`[harness] removed ${path.relative(repoRoot, resolved)}`);
      } else if (!ctx.quiet) {
        console.log(`[harness] skipped missing ${path.relative(repoRoot, resolved)}`);
      }
    }
    logger.log({ event: "builtin_end", skill: skill.name, step: step.name, status: 0 });
    return 0;
  }

  logger.log({ event: "builtin_end", skill: skill.name, step: step.name, status: 1, error: "unknown builtin" });
  console.error(`[harness] unknown builtin: ${step.builtin}`);
  return 1;
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function windowsPowerShellPath() {
  const candidates = [
    "C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    "powershell.exe"
  ];
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return "powershell.exe";
}

function uniqueLogFile(label) {
  const dir = path.join(repoRoot, "logs", "harness");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = `${Date.now()}-${process.pid}-${Math.random().toString(16).slice(2)}`;
  return path.join(dir, `${label}-${stamp}.log`);
}

function buildSpawnCommand(command) {
  const executable = resolveExecutable(command[0]) || command[0];
  const args = command.slice(1);

  if (command[0] === "bash" && os.platform() === "win32") {
    const stdoutFile = uniqueLogFile("bash-stdout");
    const stderrFile = uniqueLogFile("bash-stderr");
    const psArgs = args.map(quotePowerShell).join(", ");
    const script = [
      `$argList = @(${psArgs})`,
      `$p = Start-Process -WindowStyle Hidden -FilePath ${quotePowerShell(executable)} -ArgumentList $argList -RedirectStandardOutput ${quotePowerShell(stdoutFile)} -RedirectStandardError ${quotePowerShell(stderrFile)} -Wait -PassThru`,
      `if (Test-Path ${quotePowerShell(stdoutFile)}) { $o = Get-Content ${quotePowerShell(stdoutFile)} -Raw; if ($o) { [Console]::Out.Write($o) } }`,
      `if (Test-Path ${quotePowerShell(stderrFile)}) { $e = Get-Content ${quotePowerShell(stderrFile)} -Raw; if ($e) { [Console]::Error.Write($e) } }`,
      "exit $p.ExitCode"
    ].join("; ");
    return {
      executable: windowsPowerShellPath(),
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      display: [executable, ...args]
    };
  }

  return {
    executable,
    args,
    display: [executable, ...args]
  };
}

function makeLogger(ctx, action) {
  const logDir = resolveRepoPath(ctx.harnessLogDir, ctx);
  fs.mkdirSync(logDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `${stamp}-${action}.jsonl`);
  function log(event) {
    fs.appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n");
  }
  return { logPath, log };
}

function executeStep(step, skill, ctx, logger) {
  if (!conditionMatches(step.whenInputEquals, ctx)) {
    logger.log({ event: "step_skipped", skill: skill.name, step: step.name });
    return 0;
  }

  const stepCtx = { ...ctx };
  for (const [key, value] of Object.entries(step.with || {})) {
    stepCtx[key] = subst(value, ctx);
  }

  if (step.builtin) {
    if (!ctx.quiet) {
      console.log(`[harness] ${skill.name}: ${step.name}`);
      console.log(`[harness] builtin:${step.builtin}`);
    }
    return runBuiltin(step, skill, stepCtx, logger);
  }

  const command = buildCommand(step, stepCtx);
  const spawnCommand = buildSpawnCommand(command);
  logger.log({ event: "step_start", skill: skill.name, step: step.name, command });
  if (!ctx.quiet) {
    console.log(`[harness] ${skill.name}: ${step.name}`);
    console.log(`[harness] $ ${spawnCommand.display.join(" ")}`);
  }

  const result = spawnSync(spawnCommand.executable, spawnCommand.args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    env: process.env
  });
  const status = result.status === null ? 1 : result.status;
  logger.log({ event: "step_end", skill: skill.name, step: step.name, status, signal: result.signal || null });
  return status;
}

function executeSkill(skill, ctx, logger) {
  validateSkillContract(skill);
  if (!skill.supportedPlatforms.includes(os.platform())) {
    throw new Error(`${skill.name} does not support platform ${os.platform()}`);
  }
  checkSkill(skill, ctx, "prechecks");
  logger.log({ event: "skill_start", skill: skill.name });

  for (const step of skill.execution) {
    const status = executeStep(step, skill, ctx, logger);
    if (status !== 0) {
      logger.log({
        event: "skill_failed",
        skill: skill.name,
        status,
        diagnostics: skill.failureHandling.diagnostics || [],
        recovery: skill.recovery.instructions || []
      });

      for (const recoveryStep of skill.recovery.commands || []) {
        if (conditionMatches(recoveryStep.whenInputEquals, ctx)) {
          executeStep(recoveryStep, skill, ctx, logger);
        }
      }

      if (skill.failureHandling.stopOnFailure !== false) {
        throw new Error(`${skill.name} failed with exit code ${status}`);
      }
    }
  }

  checkSkill(skill, ctx, "validation");
  logger.log({ event: "skill_success", skill: skill.name });
}

function getWorkflowPlan(workflow, ctx) {
  switch (workflow) {
    case "benchmark": {
      const plan = [];
      if (ctx.reset) plan.push("cleanup-benchmark");
      if (!ctx.skipGen) plan.push("project-generation");
      if (!ctx.skipEval) plan.push(ctx.skipE2e ? "evaluation-workflow" : "eval-complete-pipeline");
      return plan;
    }
    case "generate":
      return ["project-generation"];
    case "evaluate":
      return [ctx.skipE2e ? "evaluation-workflow" : "eval-complete-pipeline"];
    case "render-prompt":
      return ["prompt-rendering"];
    default:
      return [workflow];
  }
}

function listSkills(skills) {
  for (const skill of [...skills.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`${skill.name}\t${skill.description}`);
  }
}

function printPlan(plan, skills, ctx) {
  console.log(JSON.stringify({
    workflow: ctx.workflow || null,
    plan: plan.map((name) => {
      const skill = skills.get(name);
      return {
        skill: name,
        description: skill ? skill.description : null,
        execution: skill ? skill.execution.map((step) => step.name) : []
      };
    }),
    inputs: {
      model: ctx.model,
      level: ctx.level,
      backend: ctx.backend,
      frontend: ctx.frontend,
      harness: ctx.harness,
      provider: ctx.provider,
      outputDir: ctx.outputDir,
      resultsDir: ctx.resultsDir,
      skipGen: ctx.skipGen,
      skipEval: ctx.skipEval,
      skipE2e: ctx.skipE2e,
      reset: ctx.reset
    }
  }, null, 2));
}

function main() {
  const [action, ...rest] = process.argv.slice(2);
  if (!action || action === "--help" || action === "help") {
    usage();
    return;
  }

  const rawInputs = parseArgs(rest);
  const ctx = deriveContext(rawInputs);
  const skills = loadSkills();

  if (action === "list") {
    listSkills(skills);
    return;
  }

  if (action === "validate") {
    for (const skill of skills.values()) validateSkillContract(skill);
    console.log(`Validated ${skills.size} skill contracts`);
    return;
  }

  const workflow = ctx.workflow || rawInputs.workflow || "benchmark";
  ctx.workflow = workflow;
  const plan = action === "run-skill"
    ? [ctx.skill]
    : getWorkflowPlan(workflow, ctx);

  if (!Array.isArray(plan) || plan.length === 0 || plan.some((name) => !name)) {
    throw new Error("No skills selected");
  }

  for (const name of plan) {
    if (!skills.has(name)) {
      throw new Error(`Skill not found: ${name}`);
    }
  }

  if (action === "plan") {
    printPlan(plan, skills, ctx);
    return;
  }

  if (action !== "run" && action !== "run-skill") {
    usage();
    throw new Error(`Unknown action: ${action}`);
  }

  const logger = makeLogger(ctx, action);
  logger.log({ event: "harness_start", action, workflow, plan, inputs: ctx });
  console.log(`[harness] log: ${path.relative(repoRoot, logger.logPath)}`);

  for (const name of plan) {
    executeSkill(skills.get(name), ctx, logger);
  }

  logger.log({ event: "harness_success", action, workflow, plan });
  console.log("[harness] workflow completed");
}

try {
  main();
} catch (error) {
  console.error(`[harness] ERROR: ${error.message}`);
  process.exit(1);
}
