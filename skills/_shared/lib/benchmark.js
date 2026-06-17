"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync, spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "../../..");

const LEVELS = ["overview", "detailed"];
const BACKENDS = ["node-js", "spring-boot", "quarkus"];
const FRONTENDS = ["react", "angular"];
const HARNESSES = ["opencode", "pi", "claude", "codex", "kilo-code", "mimo-code"];
const PROVIDERS = ["z-ai", "zai-coding-plan", "zai-coding-cn", "openrouter", "mimo", "openai", "anthropic"];

function toCamel(name) {
  return name.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = toCamel(arg.slice(2));
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function boolValue(value) {
  return value === true || value === "true" || value === "1" || value === "yes";
}

function requireValue(label, value, allowed) {
  if (!allowed.includes(value)) {
    throw new Error(`Invalid ${label}: ${value}. Valid options: ${allowed.join(", ")}`);
  }
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

function workspaceDir({ harness = "opencode", model, level }) {
  return path.join("WORKSPACE", slugifyModel(harness, model), level);
}

function resultsDir({ harness = "opencode", model, backend, frontend, level }) {
  return path.join("RESULTS", slugifyModel(harness, model), `${backend}-${frontend}`, level);
}

function resolveRepoPath(value) {
  if (!value) return "";
  return path.isAbsolute(value) ? value : path.join(repoRoot, value);
}

function relativeToRepo(value) {
  return path.relative(repoRoot, resolveRepoPath(value));
}

function ensureInside(target, root, label) {
  const resolvedTarget = path.resolve(resolveRepoPath(target));
  const resolvedRoot = path.resolve(resolveRepoPath(root));
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`${label || "Path"} must stay under ${resolvedRoot}: ${resolvedTarget}`);
  }
  return resolvedTarget;
}

function ensureFile(filePath, label) {
  const resolved = resolveRepoPath(filePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`${label || "File"} not found: ${resolved}`);
  }
  return resolved;
}

function ensureDir(dirPath, label) {
  const resolved = resolveRepoPath(dirPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`${label || "Directory"} not found: ${resolved}`);
  }
  return resolved;
}

function mkdirForFile(filePath) {
  fs.mkdirSync(path.dirname(resolveRepoPath(filePath)), { recursive: true });
}

function isRuntimeSupported(backend, frontend) {
  return ["spring-boot", "node-js"].includes(backend) && ["angular", "react"].includes(frontend);
}

function commandAvailable(command) {
  if (!command) return false;
  if (path.isAbsolute(command) && fs.existsSync(command)) return true;
  const probe = os.platform() === "win32" ? "where.exe" : "command";
  const args = os.platform() === "win32" ? [command] : ["-v", command];
  const result = spawnSync(probe, args, { stdio: "ignore", shell: false });
  return result.status === 0;
}

function resolveHarnessCli(harness) {
  const candidatesByHarness = {
    opencode: [process.env.BENCHMARK_OPENCODE_CLI, "opencode"],
    pi: [
      process.env.BENCHMARK_PI_CLI,
      process.env.PI_CLI,
      path.join(os.homedir(), "AppData/Local/pi-node/current/pi.cmd"),
      path.join(os.homedir(), "AppData/Local/pi-node/current/pi"),
      "pi"
    ],
    claude: [process.env.BENCHMARK_CLAUDE_CLI, "claude"],
    codex: [process.env.BENCHMARK_CODEX_CLI, "codex"],
    "kilo-code": [process.env.BENCHMARK_KILO_CODE_CLI, "kilo-code", "kilo"],
    "mimo-code": [process.env.BENCHMARK_MIMO_CODE_CLI, "mimo-code", "mimo"]
  };
  for (const candidate of candidatesByHarness[harness] || []) {
    if (!candidate) continue;
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) return candidate;
    if (commandAvailable(candidate)) return candidate;
  }
  return "";
}

function mapHarnessProvider(harness, provider) {
  if (harness === "opencode" && provider === "z-ai") return "zai-coding-plan";
  if (harness === "pi" && provider === "z-ai") return "zai-coding-cn";
  return provider;
}

function mapHarnessModel(provider, model) {
  switch (model) {
    case "GLM-5.1Z.AI":
    case "glm-5.1z.ai":
    case "glm-5.1":
      return ["zai-coding-plan", "zai-coding-cn"].includes(provider) ? "glm-5.1" : model;
    case "kimi/2.6":
      return provider === "openrouter" ? "moonshotai/kimi-k2.6" : model;
    case "minimax/1.5":
      return provider === "openrouter" ? "minimax/minimax-m3" : model;
    case "xiaomi/mimo-2.5":
      return provider === "openrouter" ? "xiaomi/mimo-v2.5-pro" : model;
    default:
      return model;
  }
}

function formatHarnessModel(provider, model) {
  return String(model).startsWith(`${provider}/`) ? model : `${provider}/${model}`;
}

function renderPrompt({ template, specFile, backendCartridge, frontendCartridge, level, backend, frontend, output }) {
  const templatePath = ensureFile(template, "Prompt template");
  const specPath = ensureFile(specFile, "Specification");
  const backendPath = ensureFile(backendCartridge, "Backend cartridge");
  const frontendPath = ensureFile(frontendCartridge, "Frontend cartridge");

  let rendered = fs.readFileSync(templatePath, "utf8");
  const replacements = {
    "{{LEVEL}}": level,
    "{{BACKEND}}": backend,
    "{{FRONTEND}}": frontend,
    "{{SPEC_CONTENT}}": fs.readFileSync(specPath, "utf8"),
    "{{BACKEND_CARTRIDGE}}": fs.readFileSync(backendPath, "utf8"),
    "{{FRONTEND_CARTRIDGE}}": fs.readFileSync(frontendPath, "utf8")
  };

  for (const [token, value] of Object.entries(replacements)) {
    rendered = rendered.split(token).join(value);
  }

  if (output) {
    const outputPath = resolveRepoPath(output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, rendered);
  } else {
    process.stdout.write(rendered);
  }

  return rendered;
}

function cleanupBenchmark({ model, level, backend, frontend, harness = "opencode", scope = "all", quiet = false }) {
  requireValue("level", level, LEVELS);
  requireValue("backend", backend, BACKENDS);
  requireValue("frontend", frontend, FRONTENDS);
  requireValue("harness", harness, HARNESSES);
  requireValue("scope", scope, ["workspace", "results", "all"]);

  const targets = [];
  if (scope === "workspace" || scope === "all") {
    targets.push(ensureInside(workspaceDir({ harness, model, level }), "WORKSPACE", "Workspace cleanup target"));
  }
  if (scope === "results" || scope === "all") {
    targets.push(ensureInside(resultsDir({ harness, model, backend, frontend, level }), "RESULTS", "Results cleanup target"));
  }

  for (const target of targets) {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      if (!quiet) console.log(`[cleanup] removed ${path.relative(repoRoot, target)}`);
    } else if (!quiet) {
      console.log(`[cleanup] skipped missing ${path.relative(repoRoot, target)}`);
    }
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    stdio: options.stdio || "inherit",
    encoding: options.encoding,
    env: { ...process.env, ...(options.env || {}) },
    shell: false
  });
  if (result.error) {
    throw result.error;
  }
  return result;
}

function runCommandChecked(command, args, options = {}) {
  const result = runCommand(command, args, options);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result;
}

function countGeneratedFiles(outputDir) {
  const root = resolveRepoPath(outputDir);
  if (!fs.existsSync(root)) return 0;
  let count = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (!/\.[^.]+-session(-id)?$/.test(entry.name) && !/\.[^.]+\.session(-id)?$/.test(entry.name)) {
        count += 1;
      }
    }
  };
  walk(root);
  return count;
}

function monitorProcessWithActivity(child, outputDir, timeoutSeconds, inactivitySeconds) {
  return new Promise((resolve) => {
    let elapsed = 0;
    let inactive = 0;
    let lastCount = countGeneratedFiles(outputDir);
    let finished = false;

    const finish = (code, signal) => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      resolve({ code: code ?? 1, signal: signal || null });
    };

    const terminate = (code) => {
      try {
        child.kill("SIGTERM");
      } catch {}
      setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {}
        finish(code, null);
      }, 1000);
    };

    const timer = setInterval(() => {
      elapsed += 1;
      const currentCount = countGeneratedFiles(outputDir);
      if (currentCount > lastCount) {
        lastCount = currentCount;
        inactive = 0;
        if (elapsed > 10) console.log(`[generation] activity detected (${currentCount} files)`);
      } else {
        inactive += 1;
      }
      if (inactive >= inactivitySeconds) {
        console.error(`[generation] no file activity for ${inactivitySeconds}s; terminating`);
        terminate(124);
      } else if (elapsed >= timeoutSeconds) {
        console.error(`[generation] exceeded max timeout of ${timeoutSeconds}s; terminating`);
        terminate(124);
      }
    }, 1000);

    child.on("exit", finish);
    child.on("error", () => finish(1, null));
  });
}

function spawnStreaming(command, args, options = {}) {
  return spawn(command, args, {
    cwd: options.cwd || repoRoot,
    stdio: "inherit",
    env: { ...process.env, ...(options.env || {}) },
    shell: false
  });
}

function parseJsonSafe(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readJson(filePath, fallback = null) {
  const resolved = resolveRepoPath(filePath);
  if (!fs.existsSync(resolved)) return fallback;
  return parseJsonSafe(fs.readFileSync(resolved, "utf8"), fallback);
}

function writeJson(filePath, value) {
  const resolved = resolveRepoPath(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, JSON.stringify(value, null, 2));
}

module.exports = {
  repoRoot,
  LEVELS,
  BACKENDS,
  FRONTENDS,
  HARNESSES,
  PROVIDERS,
  parseArgs,
  boolValue,
  requireValue,
  slugifyModel,
  workspaceDir,
  resultsDir,
  resolveRepoPath,
  relativeToRepo,
  ensureInside,
  ensureFile,
  ensureDir,
  mkdirForFile,
  isRuntimeSupported,
  commandAvailable,
  resolveHarnessCli,
  mapHarnessProvider,
  mapHarnessModel,
  formatHarnessModel,
  renderPrompt,
  cleanupBenchmark,
  runCommand,
  runCommandChecked,
  countGeneratedFiles,
  monitorProcessWithActivity,
  spawnStreaming,
  parseJsonSafe,
  readJson,
  writeJson
};
