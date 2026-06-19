const fs = require("fs");
const path = require("path");

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/");
}

function safeRecursiveRead(dir) {
  try {
    return fs.readdirSync(dir, { recursive: true }) || [];
  } catch {
    return [];
  }
}

function resolveBackendRoot(projectDir) {
  const nestedDir = path.join(projectDir, "backend");
  if (fs.existsSync(nestedDir)) {
    return nestedDir;
  }

  const hasRootMaven = fs.existsSync(path.join(projectDir, "pom.xml"));
  const hasRootSource = fs.existsSync(path.join(projectDir, "src", "main", "java"));
  if (hasRootMaven && hasRootSource) {
    return projectDir;
  }

  return null;
}

function resolveFrontendRoot(projectDir) {
  const nestedDir = path.join(projectDir, "frontend");
  if (fs.existsSync(nestedDir)) {
    return nestedDir;
  }

  const hasRootPackage = fs.existsSync(path.join(projectDir, "package.json"));
  const hasRootAngular = fs.existsSync(path.join(projectDir, "angular.json"));

  if (hasRootPackage || hasRootAngular) {
    const hasRootApp = fs.existsSync(path.join(projectDir, "src", "app"));
    const hasRootBootstrap = fs.existsSync(path.join(projectDir, "src", "main.ts"));
    if (hasRootApp || hasRootBootstrap) {
      return projectDir;
    }

    const hasReactApp = fs.existsSync(path.join(projectDir, "src", "App.tsx")) ||
                        fs.existsSync(path.join(projectDir, "src", "App.jsx"));
    if (hasReactApp) {
      return projectDir;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));
      if (pkg.dependencies && (pkg.dependencies.react || pkg.dependencies["@angular/core"])) {
        return projectDir;
      }
    } catch {}
  }

  return null;
}

function describeSupportedLayout() {
  return "Expected backend/ and frontend/ directories, or a root-level Spring Boot/Angular/React layout.";
}

module.exports = {
  describeSupportedLayout,
  normalizePath,
  resolveBackendRoot,
  resolveFrontendRoot,
  safeRecursiveRead
};
