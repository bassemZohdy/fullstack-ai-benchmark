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

function testReactStructure(projectDir) {
  const tests = [];

  const frontendDir = resolveFrontendRoot(projectDir);
  if (!frontendDir) {
    return [{
      name: "Supported frontend layout detected",
      status: "failed",
      details: `No supported React layout found. ${describeSupportedLayout()}`
    }];
  }

  const packageJsonPath = path.join(frontendDir, "package.json");
  const hasPackageJson = fs.existsSync(packageJsonPath);
  tests.push({
    name: "package.json exists",
    status: hasPackageJson ? "passed" : "failed",
    details: hasPackageJson ? "" : "package.json not found"
  });

  if (hasPackageJson) {
    const packageContent = readFile(packageJsonPath);

    const hasReact = /"react"/.test(packageContent);
    tests.push({
      name: "React dependency configured",
      status: hasReact ? "passed" : "failed",
      details: hasReact ? "" : "react not found in dependencies"
    });

    const hasReactDom = /"react-dom"/.test(packageContent);
    tests.push({
      name: "react-dom dependency configured",
      status: hasReactDom ? "passed" : "failed",
      details: hasReactDom ? "" : "react-dom not found in dependencies"
    });

    const hasBuildScript = /"build"/.test(packageContent);
    tests.push({
      name: "Build script defined",
      status: hasBuildScript ? "passed" : "failed",
      details: hasBuildScript ? "" : "build script not found in package.json"
    });

    const hasTestScript = /"test"/.test(packageContent);
    tests.push({
      name: "Test script defined",
      status: hasTestScript ? "passed" : "failed",
      details: hasTestScript ? "" : "test script not found in package.json"
    });
  }

  const hasAppFile = hasFile(frontendDir, /^src\/App\.(tsx|jsx|js)$/i);
  tests.push({
    name: "App component exists",
    status: hasAppFile ? "passed" : "failed",
    details: hasAppFile ? "" : "src/App.tsx or src/App.jsx not found"
  });

  const hasIndexFile = hasFile(frontendDir, /^src\/(index|main)\.(tsx|jsx|js)$/i);
  tests.push({
    name: "Entry point exists",
    status: hasIndexFile ? "passed" : "failed",
    details: hasIndexFile ? "" : "src/index or src/main file not found"
  });

  const hasComponents = hasFile(frontendDir, /src\/components?\//i) || hasFile(frontendDir, /src\/pages?\//i);
  tests.push({
    name: "Components or pages directory exists",
    status: hasComponents ? "passed" : "failed",
    details: hasComponents ? "" : "No components or pages directory found"
  });

  const hasRouter = hasFile(frontendDir, /react-router/i) || hasFile(frontendDir, /BrowserRouter|Routes|Route/i);
  tests.push({
    name: "Routing configured",
    status: hasRouter ? "passed" : "failed",
    details: hasRouter ? "" : "No react-router usage found"
  });

  const hasViteConfig = fs.existsSync(path.join(frontendDir, "vite.config.ts")) ||
                        fs.existsSync(path.join(frontendDir, "vite.config.js"));
  const hasWebpackConfig = fs.existsSync(path.join(frontendDir, "webpack.config.js"));
  const hasBuildTool = hasViteConfig || hasWebpackConfig;
  tests.push({
    name: "Build tool configured (Vite or Webpack)",
    status: hasBuildTool ? "passed" : "failed",
    details: hasBuildTool ? "" : "No vite.config or webpack.config found"
  });

  const hasTests = hasFile(frontendDir, /\.test\.(tsx|jsx|js)$/i) || hasFile(frontendDir, /\.spec\.(tsx|jsx|js)$/i) || hasFile(frontendDir, /__tests__\//i);
  tests.push({
    name: "Test files exist",
    status: hasTests ? "passed" : "failed",
    details: hasTests ? "" : "No test files found"
  });

  return tests;
}

module.exports = {
  name: "React Frontend Evaluator",
  version: "1.0",
  testReactStructure
};
