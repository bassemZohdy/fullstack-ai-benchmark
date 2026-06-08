const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
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
  const timeout = options.timeout || 120000;
  const composePath = checkDockerCompose(projectDir);

  if (!composePath) {
    return {
      status: "failed",
      error: "docker-compose.yml not found"
    };
  }

  return new Promise((resolve) => {
    const startTime = Date.now();

    try {
      const result = spawnSync("docker", ["compose", "up", "-d"], {
        cwd: projectDir,
        encoding: "utf8",
        timeout
      });

      const duration = Date.now() - startTime;

      resolve({
        status: result.status === 0 ? "started" : "failed",
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

function probePort(port, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: "localhost", port, path: "/health", method: "GET" },
      (res) => {
        res.resume();
        resolve({
          open: true,
          statusCode: res.statusCode
        });
      }
    );

    req.on("error", () => {
      resolve({
        open: false,
        statusCode: null
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy(new Error("Request timeout"));
    });

    req.end();
  });
}

async function waitForHealth(projectDir, options = {}) {
  const timeout = options.timeout || 120000;
  const startTime = Date.now();
  const ports = [80, 8080, 8081, 4200, 3000, 8000, 5000];

  while (Date.now() - startTime <= timeout) {
    const probes = await Promise.all(ports.map((port) => probePort(port)));
    const healthyProbe = probes.find((probe) => probe.open && (probe.statusCode === 200 || probe.statusCode === 404));

    if (healthyProbe) {
      return {
        ready: true,
        duration: Date.now() - startTime,
        port: ports[probes.indexOf(healthyProbe)],
        statusCode: healthyProbe.statusCode
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return {
    ready: false,
    duration: Date.now() - startTime,
    error: "Service health check timeout"
  };
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
