const fs = require("fs");
const path = require("path");
const { spawnSync, spawn } = require("child_process");
const http = require("http");

function checkDockerCompose(projectDir) {
  const composePaths = [
    path.join(projectDir, "docker-compose.yml"),
    path.join(projectDir, "docker-compose.yaml")
  ];

  for (const composePath of composePaths) {
    if (fs.existsSync(composePath)) {
      return composePath;
    }
  }

  return null;
}

async function startup(projectDir, options = {}) {
  const timeout = options.timeout || 120000; // 2 min default
  const composePath = checkDockerCompose(projectDir);

  if (!composePath) {
    return {
      status: "failed",
      error: "docker-compose.yml not found"
    };
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    let lastActivityTime = startTime;
    let processActive = false;

    try {
      const result = spawnSync("docker", ["compose", "up", "-d"], {
        cwd: projectDir,
        encoding: "utf8",
        timeout
      });

      const duration = Date.now() - startTime;
      processActive = result.status === 0;

      resolve({
        status: processActive ? "started" : "failed",
        exitCode: result.status,
        duration,
        error: result.status !== 0 ? (result.stderr || "Failed to start services") : null
      });
    } catch (err) {
      resolve({
        status: "failed",
        error: err.message
      });
    }
  });
}

async function waitForHealth(projectDir, options = {}) {
  const timeout = options.timeout || 60000; // 1 min default
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Check common ports used by Spring Boot and Angular/React
      const ports = [8080, 8081, 3000, 8000, 5000];
      let anyPortOpen = false;

      for (const port of ports) {
        const req = http.request(
          { host: "localhost", port, path: "/health", method: "GET" },
          (res) => {
            if (res.statusCode === 200 || res.statusCode === 404) {
              anyPortOpen = true;
            }
          }
        );
        req.on("error", () => {}); // Ignore errors
        req.setTimeout(1000, () => req.abort());
        req.end();
      }

      if (anyPortOpen) {
        clearInterval(checkInterval);
        resolve({
          ready: true,
          duration: elapsed
        });
        return;
      }

      if (elapsed > timeout) {
        clearInterval(checkInterval);
        resolve({
          ready: false,
          duration: elapsed,
          error: "Service health check timeout"
        });
        return;
      }
    }, 2000); // Check every 2 seconds
  });
}

async function shutdown(projectDir) {
  return new Promise((resolve) => {
    try {
      const result = spawnSync("docker", ["compose", "down"], {
        cwd: projectDir,
        encoding: "utf8",
        timeout: 30000
      });

      resolve({
        status: result.status === 0 ? "stopped" : "warning",
        error: result.status !== 0 ? (result.stderr || "Warning: Cleanup may be incomplete") : null
      });
    } catch (err) {
      resolve({
        status: "warning",
        error: err.message
      });
    }
  });
}

module.exports = { startup, waitForHealth, shutdown };
