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
      { host: "localhost", port, path: "/", method: "GET" },
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

function extractPublishedPorts(projectDir) {
  const composePath = checkDockerCompose(projectDir);
  if (!composePath) {
    return { backend: [8080], frontend: [4200, 80] };
  }

  try {
    const content = fs.readFileSync(composePath, "utf8");
    const backendPorts = [];
    const frontendPorts = [];
    let currentService = null;
    let inServices = false;

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!inServices && line === "services:") {
        inServices = true;
        continue;
      }

      if (!inServices) continue;
      if (/^[A-Za-z0-9_-]+:\s*$/.test(line) && !/^(backend|frontend|api|web|ui):\s*$/.test(line)) {
        continue;
      }

      const serviceMatch = /^\s{2}([a-zA-Z0-9_-]+):\s*$/.exec(rawLine);
      if (serviceMatch) {
        currentService = serviceMatch[1];
        continue;
      }

      const portMatch = /^-\s*["']?(\d+):(\d+)/.exec(line);
      if (!portMatch || !currentService) continue;

      const hostPort = Number(portMatch[1]);
      if (!Number.isFinite(hostPort)) continue;

      if (/backend|api/i.test(currentService)) {
        backendPorts.push(hostPort);
      } else if (/frontend|web|ui/i.test(currentService)) {
        frontendPorts.push(hostPort);
      }
    }

    return {
      backend: backendPorts.length ? backendPorts : [8080],
      frontend: frontendPorts.length ? frontendPorts : [4200, 80]
    };
  } catch {
    return { backend: [8080], frontend: [4200, 80] };
  }
}

function probePath(port, requestPath, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: "localhost", port, path: requestPath, method: "GET" },
      (res) => {
        res.resume();
        resolve({
          open: true,
          statusCode: res.statusCode,
          path: requestPath
        });
      }
    );

    req.on("error", () => {
      resolve({
        open: false,
        statusCode: null,
        path: requestPath
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy(new Error("Request timeout"));
    });

    req.end();
  });
}

async function probeAny(port, paths, timeout = 1000) {
  for (const requestPath of paths) {
    const probe = await probePath(port, requestPath, timeout);
    if (probe.open && probe.statusCode >= 200 && probe.statusCode < 400) {
      return probe;
    }
  }

  return { open: false, statusCode: null, path: null };
}

async function waitForHealth(projectDir, options = {}) {
  const timeout = options.timeout || 120000;
  const port = options.port || Number(process.env.BENCHMARK_API_PORT || 8080);
  const ports = extractPublishedPorts(projectDir);
  const backendPorts = [port, ...ports.backend.filter((value) => value !== port)];
  const frontendPorts = ports.frontend;
  const startTime = Date.now();
  const backendPaths = ["/actuator/health", "/health", "/api/todos"];
  const frontendPaths = ["/"];

  while (Date.now() - startTime <= timeout) {
    let backendProbe = null;
    for (const backendPort of backendPorts) {
      const probe = await probeAny(backendPort, backendPaths);
      if (probe.open) {
        backendProbe = { ...probe, port: backendPort };
        break;
      }
    }

    let frontendProbe = null;
    for (const frontendPort of frontendPorts) {
      const probe = await probeAny(frontendPort, frontendPaths);
      if (probe.open) {
        frontendProbe = { ...probe, port: frontendPort };
        break;
      }
    }

    if (backendProbe && frontendProbe) {
      return {
        ready: true,
        duration: Date.now() - startTime,
        backend: backendProbe,
        frontend: frontendProbe
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
