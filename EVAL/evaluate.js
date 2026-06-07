#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "target" || entry.name === "dist") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function rel(projectDir, file) {
  return path.relative(projectDir, file).replace(/\\/g, "/");
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function hasAny(files, patterns) {
  return files.some((file) => patterns.some((pattern) => pattern.test(file)));
}

function addTest(results, category, name, passed, details = "") {
  results[category].tests.push({
    name,
    status: passed ? "passed" : "failed",
    details
  });
  results[category][passed ? "passed" : "failed"] += 1;
}

function findPackageJsons(files) {
  return files.filter((file) => path.basename(file) === "package.json");
}

function packageHasScript(file, scriptName) {
  try {
    const pkg = JSON.parse(readText(file));
    return Boolean(pkg.scripts && pkg.scripts[scriptName]);
  } catch {
    return false;
  }
}

function runCommand(command, args, cwd, timeoutSeconds) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: timeoutSeconds * 1000,
    shell: false
  });
  return {
    ok: result.status === 0,
    durationMs: Date.now() - started,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim().slice(0, 5000)
  };
}

function runAvailableBuildTests(projectDir, files, results, timeoutSeconds) {
  const packages = findPackageJsons(files);
  for (const packageFile of packages) {
    const packageDir = path.dirname(packageFile);
    const relativePackage = rel(projectDir, packageFile);
    let hasNodeModules = fs.existsSync(path.join(packageDir, "node_modules"));

    // Auto-install dependencies if missing
    if (!hasNodeModules && (packageHasScript(packageFile, "build") || packageHasScript(packageFile, "test"))) {
      const installResult = runCommand("npm", ["install"], packageDir, timeoutSeconds);
      if (installResult.ok) {
        hasNodeModules = fs.existsSync(path.join(packageDir, "node_modules"));
      }
      // Continue even if install fails - tests will capture the failure
    }

    if (packageHasScript(packageFile, "build")) {
      if (hasNodeModules) {
        const result = runCommand("npm", ["run", "build"], packageDir, timeoutSeconds);
        addTest(results, "code_quality", `${relativePackage} npm run build`, result.ok, result.output);
      } else {
        addTest(results, "code_quality", `${relativePackage} npm run build`, false, "npm install failed; cannot run build script");
      }
    }

    if (packageHasScript(packageFile, "test")) {
      if (hasNodeModules) {
        const result = runCommand("npm", ["test", "--", "--runInBand"], packageDir, timeoutSeconds);
        addTest(results, "code_quality", `${relativePackage} npm test`, result.ok, result.output);
      } else {
        addTest(results, "code_quality", `${relativePackage} npm test`, false, "npm install failed; cannot run test script");
      }
    }
  }

  const mavenWrappers = files.filter((file) => path.basename(file) === "mvnw");
  for (const wrapper of mavenWrappers) {
    try {
      fs.chmodSync(wrapper, 0o755);
    } catch {
      // chmod failure is captured by the command result below.
    }
    const result = runCommand(wrapper, ["-q", "test"], path.dirname(wrapper), timeoutSeconds);
    addTest(results, "code_quality", `${rel(projectDir, wrapper)} Maven tests`, result.ok, result.output);
  }
}

function scoreCategory(category) {
  const total = category.passed + category.failed;
  if (total === 0) return 0;
  return Math.round((category.passed / total) * 100);
}

function tier(score) {
  if (score === 0) return "Catastrophic";
  if (score <= 40) return "Partially Functional";
  if (score <= 70) return "Functional but Incomplete";
  return "Production-Ready";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectDir = path.resolve(args["project-dir"] || "");
  const resultsFile = path.resolve(args["results-file"] || "");
  const timeoutSeconds = Number(args.timeout || 300);

  if (!projectDir || !fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) {
    console.error("Generated project directory does not exist.");
    process.exit(2);
  }
  if (!resultsFile) {
    console.error("Results file path is required.");
    process.exit(2);
  }

  const files = walk(projectDir);
  const relativeFiles = files.map((file) => rel(projectDir, file));
  const textFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".js", ".ts", ".tsx", ".jsx", ".java", ".json", ".yml", ".yaml", ".env", ".md", ".properties"].includes(ext);
  });
  const combinedText = textFiles.map(readText).join("\n");

  const results = {
    backend: { passed: 0, failed: 0, tests: [] },
    frontend: { passed: 0, failed: 0, tests: [] },
    devops: { passed: 0, failed: 0, tests: [] },
    integration: { passed: 0, failed: 0, tests: [] },
    code_quality: { passed: 0, failed: 0, tests: [] }
  };

  const hasBackend = hasAny(relativeFiles, [
    /(^|\/)(pom\.xml|build\.gradle|gradlew|mvnw)$/,
    /(^|\/)(server|backend|api)\/.*\.(js|ts|java)$/,
    /(^|\/)src\/main\/java\/.*\.java$/
  ]);
  const hasFrontend = hasAny(relativeFiles, [
    /(^|\/)(src|frontend|client|app)\/.*\.(tsx|jsx|ts|js|html)$/,
    /(^|\/)angular\.json$/,
    /(^|\/)vite\.config\.(js|ts)$/
  ]);
  const hasPackage = hasAny(relativeFiles, [/(^|\/)package\.json$/]);
  const hasDocker = hasAny(relativeFiles, [/(^|\/)Dockerfile$/, /(^|\/)docker-compose\.ya?ml$/]);
  const hasK8s = hasAny(relativeFiles, [/(^|\/)(k8s|kubernetes)\/.*\.ya?ml$/, /(^|\/).*deployment.*\.ya?ml$/i]);
  const hasEnvExample = hasAny(relativeFiles, [/(^|\/)\.env\.example$/]);
  const hasReadme = hasAny(relativeFiles, [/(^|\/)README\.md$/i]);

  addTest(results, "backend", "Backend source or build descriptor exists", hasBackend);
  addTest(results, "backend", "API-related code exists", /(@RestController|Controller|Router\(|express\(|app\.(get|post|put|delete)|@Path\()/.test(combinedText));
  addTest(results, "backend", "Persistence or repository layer exists", /(Repository|Entity|mongoose|sequelize|typeorm|prisma|jdbc|datasource|PanacheEntity)/i.test(combinedText));
  addTest(results, "backend", "Authentication or authorization code exists", /(jwt|token|auth|login|register|password)/i.test(combinedText));

  addTest(results, "frontend", "Frontend source or framework descriptor exists", hasFrontend || hasPackage);
  addTest(results, "frontend", "UI component code exists", /(component|useState|@Component|templateUrl|<form|<button|router)/i.test(combinedText));
  addTest(results, "frontend", "Frontend calls backend APIs", /(fetch\(|axios|HttpClient|http\.(get|post|put|delete))/i.test(combinedText));
  addTest(results, "frontend", "User-facing form or todo UI exists", /(todo|task|login|register|email|password)/i.test(combinedText));

  addTest(results, "devops", "Docker artifact exists", hasDocker);
  addTest(results, "devops", "Kubernetes manifests exist", hasK8s);
  addTest(results, "devops", "Environment example exists", hasEnvExample);
  addTest(results, "devops", "No obvious hardcoded secrets", !/(api[_-]?key|secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/i.test(combinedText));

  addTest(results, "integration", "Backend and frontend both exist", hasBackend && (hasFrontend || hasPackage));
  addTest(results, "integration", "API contracts are represented in code", /(\/api\/|\/todos?|\/tasks?|\/auth|\/login|\/register)/i.test(combinedText));
  addTest(results, "integration", "CORS or cross-origin configuration exists", /(cors|CrossOrigin|allowedOrigins|Access-Control-Allow-Origin)/i.test(combinedText));
  addTest(results, "integration", "Deployment composes multiple services", /services:\s*\n|depends_on|Service\b|Deployment\b/i.test(combinedText));

  addTest(results, "code_quality", "README documentation exists", hasReadme);
  addTest(results, "code_quality", "Automated tests are present", hasAny(relativeFiles, [/(\.test|\.spec)\.(js|ts|tsx|java)$/]));
  addTest(results, "code_quality", "Build descriptor exists", hasPackage || hasBackend);
  addTest(results, "code_quality", "Project has more than placeholder files", files.length >= 8, `${files.length} files found`);

  if (args.metrics === "all" || args.metrics === "quality") {
    runAvailableBuildTests(projectDir, files, results, timeoutSeconds);
  }

  const categoryScores = {
    backend: scoreCategory(results.backend),
    frontend: scoreCategory(results.frontend),
    devops: scoreCategory(results.devops),
    integration: scoreCategory(results.integration),
    code_quality: scoreCategory(results.code_quality)
  };

  const weights = {
    backend: 0.30,
    frontend: 0.25,
    devops: 0.25,
    integration: 0.15,
    code_quality: 0.05
  };
  const overallScore = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => sum + categoryScores[key] * weight, 0)
  );
  const totalPassed = Object.values(results).reduce((sum, category) => sum + category.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, category) => sum + category.failed, 0);
  const totalTests = totalPassed + totalFailed;
  const catastrophic = !hasBackend && !hasFrontend && !hasPackage;

  const output = {
    metadata: {
      model: args.model || null,
      provider: args.provider || null,
      harness: args.harness || null,
      level: args.level || null,
      backend: args.backend || null,
      frontend: args.frontend || null,
      timestamp: new Date().toISOString(),
      evaluation_version: "1.0",
      metrics_requested: args.metrics || "all"
    },
    quality: {
      overall_score: catastrophic ? 0 : overallScore,
      tier: catastrophic ? "Catastrophic" : tier(overallScore),
      pass_rate: totalTests === 0 ? 0 : Number((totalPassed / totalTests).toFixed(2)),
      test_count: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      scores: catastrophic ? {
        backend: 0,
        frontend: 0,
        devops: 0,
        integration: 0,
        code_quality: 0
      } : categoryScores
    },
    performance: {
      generation_time_seconds: null,
      tokens: {
        input: null,
        output: null,
        total: null
      },
      cost_usd: null
    },
    integration: {
      score: catastrophic ? 0 : categoryScores.integration,
      backend_frontend_comm: results.integration.tests[0]?.status === "passed" ? 25 : 0,
      database_integration: results.backend.tests[2]?.status === "passed" ? 20 : 0,
      api_contract: results.integration.tests[1]?.status === "passed" ? 20 : 0,
      cross_module_deps: results.integration.tests[0]?.status === "passed" ? 20 : 0,
      build_deployment: results.devops.tests[0]?.status === "passed" ? 15 : 0
    },
    test_details: results,
    strengths: Object.values(results).flatMap((category) => category.tests).filter((test) => test.status === "passed").map((test) => test.name),
    weaknesses: Object.values(results).flatMap((category) => category.tests).filter((test) => test.status === "failed").map((test) => test.name),
    status: catastrophic ? "FAILED" : "COMPLETED"
  };

  fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
  fs.writeFileSync(resultsFile, `${JSON.stringify(output, null, 2)}\n`);

  if (catastrophic) {
    console.error("Evaluation failed: generated project has no recognizable application structure.");
    process.exit(1);
  }
}

main();
