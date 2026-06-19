#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  describeSupportedLayout,
  normalizePath,
  resolveBackendRoot,
  safeRecursiveRead
} = require("../../utils/project-layout");

function hasFile(dir, pattern) {
  return safeRecursiveRead(dir).some((f) => pattern.test(normalizePath(f)));
}

function readFile(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function testNodeJsStructure(projectDir) {
  const tests = [];

  const backendDir = resolveBackendRoot(projectDir);
  if (!backendDir) {
    return [{
      name: "Supported backend layout detected",
      status: "failed",
      details: `No supported Node.js layout found. ${describeSupportedLayout()}`
    }];
  }

  const packageJsonPath = path.join(backendDir, "package.json");
  const hasPackageJson = fs.existsSync(packageJsonPath);
  tests.push({
    name: "package.json exists",
    status: hasPackageJson ? "passed" : "failed",
    details: hasPackageJson ? "" : "package.json not found"
  });

  if (hasPackageJson) {
    const packageContent = readFile(packageJsonPath);

    const hasExpress = /express/i.test(packageContent);
    tests.push({
      name: "Express dependency configured",
      status: hasExpress ? "passed" : "failed",
      details: hasExpress ? "" : "express not found in dependencies"
    });

    const hasStartScript = /"start"/.test(packageContent);
    tests.push({
      name: "Start script defined",
      status: hasStartScript ? "passed" : "failed",
      details: hasStartScript ? "" : "start script not found in package.json"
    });
  }

  const hasRoutes = hasFile(backendDir, /route[s]?\.(js|ts)$/i) || hasFile(backendDir, /router[s]?\.(js|ts)$/i);
  const hasControllers = hasFile(backendDir, /controller[s]?\.(js|ts)$/i);
  const hasApiEndpoints = hasRoutes || hasControllers;
  tests.push({
    name: "API routes or controllers exist",
    status: hasApiEndpoints ? "passed" : "failed",
    details: hasApiEndpoints ? "" : "No route or controller files found"
  });

  const hasMiddleware = hasFile(backendDir, /middleware[s]?\.(js|ts)$/i) || hasFile(backendDir, /middleware\//i);
  tests.push({
    name: "Middleware configured",
    status: hasMiddleware ? "passed" : "failed",
    details: hasMiddleware ? "" : "No middleware files found"
  });

  const hasEntryFile = hasFile(backendDir, /^(index|app|server|main)\.(js|ts)$/i);
  tests.push({
    name: "Entry point file exists",
    status: hasEntryFile ? "passed" : "failed",
    details: hasEntryFile ? "" : "No index/app/server/main file found"
  });

  const hasTests = hasFile(backendDir, /\.test\.(js|ts)$/i) || hasFile(backendDir, /\.spec\.(js|ts)$/i) || hasFile(backendDir, /__tests__\//i);
  tests.push({
    name: "Test files exist",
    status: hasTests ? "passed" : "failed",
    details: hasTests ? "" : "No test files found"
  });

  return tests;
}

module.exports = {
  name: "Node.js Backend Evaluator",
  version: "1.0",
  testNodeJsStructure
};
