#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function hasFile(dir, pattern) {
  try {
    const files = fs.readdirSync(dir, { recursive: true }) || [];
    return files.some((f) => pattern.test(f.replace(/\\/g, "/")));
  } catch {
    return false;
  }
}

function readFile(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function validateYamlContent(content) {
  // Basic YAML validation - check for required K8s fields
  const hasKind = /kind:\s*(Deployment|Service|Ingress|StatefulSet)/i.test(content);
  const hasApiVersion = /apiVersion:\s*[a-z0-9/v.]+/i.test(content);
  const hasMetadata = /metadata:/i.test(content);
  return hasKind && hasApiVersion && hasMetadata;
}

function testKubernetesConfiguration(projectDir) {
  const tests = [];
  const k8sDir = path.join(projectDir, "k8s");

  // Check for manifest files (support both .yaml and .yml)
  const hasBackendYaml = fs.existsSync(path.join(k8sDir, "backend-deployment.yaml")) ||
                        fs.existsSync(path.join(k8sDir, "backend-deployment.yml")) ||
                        fs.existsSync(path.join(k8sDir, "backend.yaml")) ||
                        fs.existsSync(path.join(k8sDir, "backend.yml"));
  tests.push({
    name: "Backend K8s manifest exists",
    status: hasBackendYaml ? "passed" : "failed",
    details: hasBackendYaml ? "" : "No backend-deployment.yaml/yml or backend.yaml/yml found"
  });

  const hasFrontendYaml = fs.existsSync(path.join(k8sDir, "frontend-deployment.yaml")) ||
                         fs.existsSync(path.join(k8sDir, "frontend-deployment.yml")) ||
                         fs.existsSync(path.join(k8sDir, "frontend.yaml")) ||
                         fs.existsSync(path.join(k8sDir, "frontend.yml"));
  tests.push({
    name: "Frontend K8s manifest exists",
    status: hasFrontendYaml ? "passed" : "failed",
    details: hasFrontendYaml ? "" : "No frontend-deployment.yaml/yml or frontend.yaml/yml found"
  });

  // Check for Services
  const hasBackendService = fs.existsSync(path.join(k8sDir, "backend-service.yaml")) ||
                           fs.existsSync(path.join(k8sDir, "backend-service.yml"));
  tests.push({
    name: "Backend Service defined",
    status: hasBackendService ? "passed" : "failed",
    details: hasBackendService ? "" : "No backend-service.yaml/yml found"
  });

  const hasFrontendService = fs.existsSync(path.join(k8sDir, "frontend-service.yaml")) ||
                            fs.existsSync(path.join(k8sDir, "frontend-service.yml"));
  tests.push({
    name: "Frontend Service defined",
    status: hasFrontendService ? "passed" : "failed",
    details: hasFrontendService ? "" : "No frontend-service.yaml/yml found"
  });

  // Check for Ingress
  const hasIngress = fs.existsSync(path.join(k8sDir, "ingress.yaml")) ||
                    fs.existsSync(path.join(k8sDir, "ingress.yml"));
  tests.push({
    name: "Ingress configured",
    status: hasIngress ? "passed" : "failed",
    details: hasIngress ? "" : "No ingress.yaml/yml found"
  });

  // Validate Backend Deployment
  if (hasBackendYaml) {
    let backendFile;
    if (fs.existsSync(path.join(k8sDir, "backend-deployment.yaml"))) {
      backendFile = path.join(k8sDir, "backend-deployment.yaml");
    } else if (fs.existsSync(path.join(k8sDir, "backend-deployment.yml"))) {
      backendFile = path.join(k8sDir, "backend-deployment.yml");
    } else if (fs.existsSync(path.join(k8sDir, "backend.yaml"))) {
      backendFile = path.join(k8sDir, "backend.yaml");
    } else {
      backendFile = path.join(k8sDir, "backend.yml");
    }
    const backendContent = readFile(backendFile);
    const isValidBackend = validateYamlContent(backendContent);

    tests.push({
      name: "Backend Deployment spec valid",
      status: isValidBackend ? "passed" : "failed",
      details: isValidBackend ? "" : "Invalid or missing Deployment spec"
    });

    if (isValidBackend) {
      const hasImage = /image:\s*[a-z0-9\-:/._]+/i.test(backendContent);
      tests.push({
        name: "Backend container image specified",
        status: hasImage ? "passed" : "failed",
        details: hasImage ? "" : "No container image defined"
      });

      const hasPort = /containerPort:|ports:/i.test(backendContent);
      tests.push({
        name: "Backend container port exposed",
        status: hasPort ? "passed" : "failed",
        details: hasPort ? "" : "No port defined in container spec"
      });

      const hasResources = /resources:|requests:|limits:/i.test(backendContent);
      tests.push({
        name: "Backend resource limits defined",
        status: hasResources ? "passed" : "failed",
        details: hasResources ? "" : "No resource requests/limits"
      });

      const hasProbes = /livenessProbe:|readinessProbe:/i.test(backendContent);
      tests.push({
        name: "Backend health checks configured",
        status: hasProbes ? "passed" : "failed",
        details: hasProbes ? "" : "No liveness or readiness probes"
      });
    }
  } else {
    tests.push({
      name: "Backend Deployment spec valid",
      status: "failed",
      details: "Skipped - manifest not found"
    });
  }

  // Validate Frontend Deployment
  if (hasFrontendYaml) {
    let frontendFile;
    if (fs.existsSync(path.join(k8sDir, "frontend-deployment.yaml"))) {
      frontendFile = path.join(k8sDir, "frontend-deployment.yaml");
    } else if (fs.existsSync(path.join(k8sDir, "frontend-deployment.yml"))) {
      frontendFile = path.join(k8sDir, "frontend-deployment.yml");
    } else if (fs.existsSync(path.join(k8sDir, "frontend.yaml"))) {
      frontendFile = path.join(k8sDir, "frontend.yaml");
    } else {
      frontendFile = path.join(k8sDir, "frontend.yml");
    }
    const frontendContent = readFile(frontendFile);
    const isValidFrontend = validateYamlContent(frontendContent);

    tests.push({
      name: "Frontend Deployment spec valid",
      status: isValidFrontend ? "passed" : "failed",
      details: isValidFrontend ? "" : "Invalid or missing Deployment spec"
    });

    if (isValidFrontend) {
      const hasImage = /image:\s*[a-z0-9\-:/._]+/i.test(frontendContent);
      tests.push({
        name: "Frontend container image specified",
        status: hasImage ? "passed" : "failed",
        details: hasImage ? "" : "No container image defined"
      });

      const hasPort = /containerPort:|ports:/i.test(frontendContent);
      tests.push({
        name: "Frontend container port exposed",
        status: hasPort ? "passed" : "failed",
        details: hasPort ? "" : "No port defined in container spec"
      });

      const hasResources = /resources:|requests:|limits:/i.test(frontendContent);
      tests.push({
        name: "Frontend resource limits defined",
        status: hasResources ? "passed" : "failed",
        details: hasResources ? "" : "No resource requests/limits"
      });

      const hasProbes = /livenessProbe:|readinessProbe:/i.test(frontendContent);
      tests.push({
        name: "Frontend health checks configured",
        status: hasProbes ? "passed" : "failed",
        details: hasProbes ? "" : "No liveness or readiness probes"
      });
    }
  } else {
    tests.push({
      name: "Frontend Deployment spec valid",
      status: "failed",
      details: "Skipped - manifest not found"
    });
  }

  // Validate Ingress if present
  if (hasIngress) {
    const ingressPath = fs.existsSync(path.join(k8sDir, "ingress.yaml"))
      ? path.join(k8sDir, "ingress.yaml")
      : path.join(k8sDir, "ingress.yml");
    const ingressContent = readFile(ingressPath);
    const hasIngressRules = /rules:|paths:/i.test(ingressContent);

    tests.push({
      name: "Ingress routing rules configured",
      status: hasIngressRules ? "passed" : "failed",
      details: hasIngressRules ? "" : "No ingress rules defined"
    });
  } else {
    tests.push({
      name: "Ingress routing rules configured",
      status: "failed",
      details: "Skipped - ingress not found"
    });
  }

  return tests;
}

module.exports = {
  name: "Kubernetes Configuration Evaluator",
  version: "1.0",
  testKubernetesConfiguration
};
