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

function hasJavaFile(dir, matcher) {
  return safeRecursiveRead(dir).some((relativePath) => {
    const normalized = normalizePath(relativePath);
    if (!/\.java$/i.test(normalized)) return false;
    const absolutePath = path.join(dir, relativePath);
    return matcher(normalized, readFile(absolutePath));
  });
}

function testSpringBootStructure(projectDir) {
  const tests = [];

  const backendDir = resolveBackendRoot(projectDir);
  if (!backendDir) {
    return [{
      name: "Supported backend layout detected",
      status: "failed",
      details: `No supported Spring Boot layout found. ${describeSupportedLayout()}`
    }];
  }

  // Check pom.xml exists
  const pomPath = path.join(backendDir, "pom.xml");
  const hasPom = fs.existsSync(pomPath);
  tests.push({
    name: "pom.xml exists",
    status: hasPom ? "passed" : "failed",
    details: hasPom ? "" : "Maven build file not found"
  });

  if (hasPom) {
    const pomContent = readFile(pomPath);

    // Check for Spring Boot dependency
    const hasSpringBoot = /spring-boot-starter/i.test(pomContent);
    tests.push({
      name: "Spring Boot dependencies configured",
      status: hasSpringBoot ? "passed" : "failed",
      details: hasSpringBoot ? "" : "spring-boot-starter not in pom.xml"
    });

    // Check for Spring Web dependency
    const hasSpringWeb = /spring-boot-starter-web|spring-web/i.test(pomContent);
    tests.push({
      name: "Spring Web configured",
      status: hasSpringWeb ? "passed" : "failed",
      details: hasSpringWeb ? "" : "Spring Web dependency missing"
    });
  }

  // Check for Spring Boot main application
  const hasMainApp = hasFile(backendDir, /src\/main\/java\/.*Application\.java$/);
  tests.push({
    name: "Main Application class exists",
    status: hasMainApp ? "passed" : "failed",
    details: hasMainApp ? "" : "No Application.java found in src/main/java"
  });

  // Check for Controllers
  const hasControllers = hasFile(backendDir, /Controller\.java$/);
  tests.push({
    name: "REST Controllers exist",
    status: hasControllers ? "passed" : "failed",
    details: hasControllers ? "" : "No Controllers found"
  });

  // Check for Services
  const hasServices = hasJavaFile(backendDir, (filePath, content) => {
    return /Service\.java$/i.test(filePath) ||
      /\/service\//i.test(filePath) ||
      /@Service\b/.test(content);
  });
  tests.push({
    name: "Service layer exists",
    status: hasServices ? "passed" : "failed",
    details: hasServices ? "" : "No Services found"
  });

  // Check for Repositories
  const hasRepositories = hasJavaFile(backendDir, (filePath, content) => {
    return /Repository\.java$/i.test(filePath) ||
      /\/repository\//i.test(filePath) ||
      /@Repository\b/.test(content) ||
      /extends\s+(JpaRepository|CrudRepository|PagingAndSortingRepository)\b/.test(content);
  });
  tests.push({
    name: "Data access layer (Repository) exists",
    status: hasRepositories ? "passed" : "failed",
    details: hasRepositories ? "" : "No Repositories found"
  });

  // Check for application.yml or application.properties
  const hasAppConfig = hasFile(backendDir, /application\.(yml|properties)$/);
  tests.push({
    name: "Application configuration exists",
    status: hasAppConfig ? "passed" : "failed",
    details: hasAppConfig ? "" : "No application.yml or application.properties"
  });

  // Check for Tests
  const hasTests = hasFile(backendDir, /src\/test\/java\/.*Test\.java$/);
  tests.push({
    name: "Unit tests exist",
    status: hasTests ? "passed" : "failed",
    details: hasTests ? "" : "No test files found"
  });

  // Check for Maven wrapper
  const hasMvnw = fs.existsSync(path.join(backendDir, "mvnw"));
  tests.push({
    name: "Maven wrapper available",
    status: hasMvnw ? "passed" : "skipped",
    details: hasMvnw ? "" : "mvnw not found; wrapper treated as optional"
  });

  return tests;
}

module.exports = {
  name: "Spring Boot Backend Evaluator",
  version: "1.0",
  testSpringBootStructure
};
