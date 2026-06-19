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

function listManifestFiles(dir) {
  try {
    return fs.readdirSync(dir, { recursive: true })
      .filter((entry) => /\.(ya?ml)$/i.test(entry))
      .map((entry) => path.join(dir, entry));
  } catch {
    return [];
  }
}

function readManifestFiles(dir) {
  return listManifestFiles(dir).map((file) => ({
    file,
    relative: file.replace(`${dir}${path.sep}`, "").replace(/\\/g, "/"),
    content: readFile(file)
  }));
}

function manifestMatches(manifest, kindPattern, rolePattern) {
  return kindPattern.test(manifest.content) &&
    (rolePattern.test(manifest.relative) || rolePattern.test(manifest.content));
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
  const k8sDir = fs.existsSync(path.join(projectDir, "k8s"))
    ? path.join(projectDir, "k8s")
    : fs.existsSync(path.join(projectDir, "kubernetes"))
      ? path.join(projectDir, "kubernetes")
      : path.join(projectDir, "k8s");
  const manifests = readManifestFiles(k8sDir);
  const backendRole = /\bbackend\b|todo-backend|\bapi\b/i;
  const frontendRole = /\bfrontend\b|todo-frontend|\bui\b|\bweb\b/i;

  // Check for manifest files (support both .yaml and .yml)
  const hasBackendYaml = manifests.some((manifest) =>
    manifestMatches(manifest, /kind:\s*(Deployment|StatefulSet)/i, backendRole)
  );
  tests.push({
    name: "Backend K8s manifest exists",
    status: hasBackendYaml ? "passed" : "failed",
    details: hasBackendYaml ? "" : "No backend-deployment.yaml/yml, backend.yaml/yml, or deployment.yaml/yml found"
  });

  const hasFrontendYaml = manifests.some((manifest) =>
    manifestMatches(manifest, /kind:\s*(Deployment|StatefulSet)/i, frontendRole)
  );
  tests.push({
    name: "Frontend K8s manifest exists",
    status: hasFrontendYaml ? "passed" : "failed",
    details: hasFrontendYaml ? "" : "No frontend-deployment.yaml/yml, frontend.yaml/yml, or deployment.yaml/yml found"
  });

  // Check for Services
  const hasBackendService = manifests.some((manifest) =>
    manifestMatches(manifest, /kind:\s*Service/i, backendRole)
  );
  tests.push({
    name: "Backend Service defined",
    status: hasBackendService ? "passed" : "failed",
    details: hasBackendService ? "" : "No backend-service.yaml/yml found"
  });

  const hasFrontendService = manifests.some((manifest) =>
    manifestMatches(manifest, /kind:\s*Service/i, frontendRole)
  );
  tests.push({
    name: "Frontend Service defined",
    status: hasFrontendService ? "passed" : "failed",
    details: hasFrontendService ? "" : "No frontend-service.yaml/yml found"
  });

  // Check for Ingress
  const hasIngress = manifests.some((manifest) => /kind:\s*Ingress/i.test(manifest.content));
  tests.push({
    name: "Ingress configured",
    status: hasIngress ? "passed" : "skipped",
    details: hasIngress ? "" : "Ingress treated as optional"
  });

  // Validate Backend Deployment
  if (hasBackendYaml) {
    const backendContent = manifests
      .filter((manifest) => manifestMatches(manifest, /kind:\s*(Deployment|StatefulSet)/i, backendRole))
      .map((manifest) => manifest.content)
      .join("\n---\n");
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
    const frontendContent = manifests
      .filter((manifest) => manifestMatches(manifest, /kind:\s*(Deployment|StatefulSet)/i, frontendRole))
      .map((manifest) => manifest.content)
      .join("\n---\n");
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
    const ingressContent = manifests
      .filter((manifest) => /kind:\s*Ingress/i.test(manifest.content))
      .map((manifest) => manifest.content)
      .join("\n---\n");
    const hasIngressRules = /rules:|paths:/i.test(ingressContent);

    tests.push({
      name: "Ingress routing rules configured",
      status: hasIngressRules ? "passed" : "failed",
      details: hasIngressRules ? "" : "No ingress rules defined"
    });
  } else {
    tests.push({
      name: "Ingress routing rules configured",
      status: "skipped",
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
