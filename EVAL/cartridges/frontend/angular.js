#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  describeSupportedLayout,
  normalizePath,
  resolveFrontendRoot,
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

function testAngularStructure(projectDir) {
  const tests = [];

  const frontendDir = resolveFrontendRoot(projectDir);
  if (!frontendDir) {
    return [{
      name: "Supported frontend layout detected",
      status: "failed",
      details: `No supported Angular layout found. ${describeSupportedLayout()}`
    }];
  }

  // Check angular.json exists
  const angularJsonPath = path.join(frontendDir, "angular.json");
  const hasAngularJson = fs.existsSync(angularJsonPath);
  tests.push({
    name: "angular.json exists",
    status: hasAngularJson ? "passed" : "failed",
    details: hasAngularJson ? "" : "Angular configuration file not found"
  });

  // Check package.json exists
  const packageJsonPath = path.join(frontendDir, "package.json");
  const hasPackageJson = fs.existsSync(packageJsonPath);
  tests.push({
    name: "package.json exists",
    status: hasPackageJson ? "passed" : "failed",
    details: hasPackageJson ? "" : "Node package file not found"
  });

  if (hasPackageJson) {
    const packageContent = readFile(packageJsonPath);

    // Check for @angular packages
    const hasAngularDeps = /@angular\/core|@angular\/platform-browser/i.test(packageContent);
    tests.push({
      name: "@angular dependencies configured",
      status: hasAngularDeps ? "passed" : "failed",
      details: hasAngularDeps ? "" : "@angular core packages missing"
    });

    // Check for build/test scripts
    const hasBuildScript = /\"build\"|\"ng build\"/.test(packageContent);
    tests.push({
      name: "Build script defined",
      status: hasBuildScript ? "passed" : "failed",
      details: hasBuildScript ? "" : "build script not found in package.json"
    });

    const hasTestScript = /\"test\"|\"ng test\"/.test(packageContent);
    tests.push({
      name: "Test script defined",
      status: hasTestScript ? "passed" : "failed",
      details: hasTestScript ? "" : "test script not found in package.json"
    });
  }

  // Check for src/app directory
  const hasAppDir = fs.existsSync(path.join(frontendDir, "src", "app"));
  tests.push({
    name: "src/app directory exists",
    status: hasAppDir ? "passed" : "failed",
    details: hasAppDir ? "" : "Angular app source directory not found"
  });

  // Check for main.ts
  const hasMainTs = fs.existsSync(path.join(frontendDir, "src", "main.ts"));
  tests.push({
    name: "main.ts bootstrap file exists",
    status: hasMainTs ? "passed" : "failed",
    details: hasMainTs ? "" : "main.ts not found"
  });

  // Check for App Component
  const hasAppComponent = hasFile(frontendDir, /app\.component\.(ts|tsx)$/);
  tests.push({
    name: "App component exists",
    status: hasAppComponent ? "passed" : "failed",
    details: hasAppComponent ? "" : "app.component.ts not found"
  });

  // Check for Module or Standalone routing
  const hasModule = hasFile(frontendDir, /app\.module\.ts$/);
  const hasRouting = hasFile(frontendDir, /app\.(routes|routing|config)\.ts$/);
  const hasModuleOrRouting = hasModule || hasRouting;
  tests.push({
    name: "Routing configured (Module or Routes)",
    status: hasModuleOrRouting ? "passed" : "failed",
    details: hasModuleOrRouting ? "" : "No app.module.ts or app.routes.ts found"
  });

  // Check for Services
  const hasServices = hasFile(frontendDir, /\.service\.ts$/);
  tests.push({
    name: "Services exist",
    status: hasServices ? "passed" : "failed",
    details: hasServices ? "" : "No services found"
  });

  // Check for Components
  const hasComponents = hasFile(frontendDir, /\.component\.ts$/);
  tests.push({
    name: "Components exist",
    status: hasComponents ? "passed" : "failed",
    details: hasComponents ? "" : "No components found"
  });

  // Check tsconfig
  const hasTsConfig = fs.existsSync(path.join(frontendDir, "tsconfig.json"));
  tests.push({
    name: "TypeScript configured",
    status: hasTsConfig ? "passed" : "failed",
    details: hasTsConfig ? "" : "tsconfig.json not found"
  });

  // Check for tests
  const hasTests = hasFile(frontendDir, /\.spec\.ts$/);
  tests.push({
    name: "Test files exist",
    status: hasTests ? "passed" : "failed",
    details: hasTests ? "" : "No .spec.ts test files found"
  });

  return tests;
}

module.exports = {
  name: "Angular Frontend Evaluator",
  version: "1.0",
  testAngularStructure
};
