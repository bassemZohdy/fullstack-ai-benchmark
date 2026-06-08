const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function buildSpringBoot(projectDir, timeout) {
  const backendDir = path.join(projectDir, "backend");
  if (!fs.existsSync(backendDir)) {
    return {
      status: "failed",
      error: "Backend directory not found"
    };
  }

  const pomPath = path.join(backendDir, "pom.xml");
  if (!fs.existsSync(pomPath)) {
    return {
      status: "failed",
      error: "pom.xml not found"
    };
  }

  // Run: mvn clean package -q (quiet mode)
  const result = spawnSync("mvn", ["clean", "package", "-q", "-DskipTests"], {
    cwd: backendDir,
    encoding: "utf8",
    timeout,
    stdio: "pipe"
  });

  return {
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    duration: Date.now(),
    output: result.stdout || result.stderr,
    error: result.status !== 0 ? (result.stderr || "Maven build failed") : null
  };
}

function buildAngular(projectDir, timeout) {
  const frontendDir = path.join(projectDir, "frontend");
  if (!fs.existsSync(frontendDir)) {
    return {
      status: "failed",
      error: "Frontend directory not found"
    };
  }

  const packagePath = path.join(frontendDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      status: "failed",
      error: "package.json not found"
    };
  }

  // First: npm install
  const installResult = spawnSync("npm", ["install", "--legacy-peer-deps"], {
    cwd: frontendDir,
    encoding: "utf8",
    timeout,
    stdio: "pipe"
  });

  if (installResult.status !== 0) {
    return {
      status: "failed",
      exitCode: installResult.status,
      error: installResult.stderr || "npm install failed"
    };
  }

  // Second: npm run build
  const buildResult = spawnSync("npm", ["run", "build"], {
    cwd: frontendDir,
    encoding: "utf8",
    timeout,
    stdio: "pipe"
  });

  return {
    status: buildResult.status === 0 ? "passed" : "failed",
    exitCode: buildResult.status,
    output: buildResult.stdout || buildResult.stderr,
    error: buildResult.status !== 0 ? (buildResult.stderr || "npm build failed") : null
  };
}

function buildNodeJs(projectDir, timeout) {
  const backendDir = path.join(projectDir, "backend");
  if (!fs.existsSync(backendDir)) {
    return {
      status: "failed",
      error: "Backend directory not found"
    };
  }

  const packagePath = path.join(backendDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      status: "failed",
      error: "package.json not found"
    };
  }

  // Run: npm install
  const result = spawnSync("npm", ["install"], {
    cwd: backendDir,
    encoding: "utf8",
    timeout,
    stdio: "pipe"
  });

  return {
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    error: result.status !== 0 ? (result.stderr || "npm install failed") : null
  };
}

function buildReact(projectDir, timeout) {
  const frontendDir = path.join(projectDir, "frontend");
  if (!fs.existsSync(frontendDir)) {
    return {
      status: "failed",
      error: "Frontend directory not found"
    };
  }

  const packagePath = path.join(frontendDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    return {
      status: "failed",
      error: "package.json not found"
    };
  }

  // First: npm install
  const installResult = spawnSync("npm", ["install"], {
    cwd: frontendDir,
    encoding: "utf8",
    timeout,
    stdio: "pipe"
  });

  if (installResult.status !== 0) {
    return {
      status: "failed",
      exitCode: installResult.status,
      error: installResult.stderr || "npm install failed"
    };
  }

  // Second: npm run build
  const buildResult = spawnSync("npm", ["run", "build"], {
    cwd: frontendDir,
    encoding: "utf8",
    timeout,
    stdio: "pipe"
  });

  return {
    status: buildResult.status === 0 ? "passed" : "failed",
    exitCode: buildResult.status,
    error: buildResult.status !== 0 ? (buildResult.stderr || "npm build failed") : null
  };
}

function validate(projectDir, backend, frontend, options = {}) {
  const timeout = options.timeout || 900000; // 15 min default
  const results = {
    status: "pending",
    backend: null,
    frontend: null,
    startedAt: new Date().toISOString()
  };

  try {
    // Build backend
    if (backend === "spring-boot") {
      results.backend = buildSpringBoot(projectDir, timeout);
    } else if (backend === "node-js") {
      results.backend = buildNodeJs(projectDir, timeout);
    } else {
      results.backend = {
        status: "skipped",
        reason: `Backend ${backend} build not implemented`
      };
    }

    // Build frontend
    if (frontend === "angular") {
      results.frontend = buildAngular(projectDir, timeout);
    } else if (frontend === "react") {
      results.frontend = buildReact(projectDir, timeout);
    } else {
      results.frontend = {
        status: "skipped",
        reason: `Frontend ${frontend} build not implemented`
      };
    }

    // Overall status
    const backendOk = results.backend.status === "passed" || results.backend.status === "skipped";
    const frontendOk = results.frontend.status === "passed" || results.frontend.status === "skipped";
    results.status = backendOk && frontendOk ? "passed" : "failed";
    results.finishedAt = new Date().toISOString();

    return results;
  } catch (err) {
    results.status = "error";
    results.error = err.message;
    results.finishedAt = new Date().toISOString();
    return results;
  }
}

module.exports = { validate };
