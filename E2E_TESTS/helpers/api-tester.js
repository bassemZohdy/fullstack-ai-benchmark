const http = require("http");

function makeRequest(host, port, path, method = "GET", timeout = 5000) {
  return new Promise((resolve) => {
    const options = {
      host,
      port,
      path,
      method,
      timeout
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          data
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: null,
        success: false,
        error: err.message
      });
    });

    req.on("timeout", () => {
      req.abort();
      resolve({
        statusCode: null,
        success: false,
        error: "Request timeout"
      });
    });

    req.end();
  });
}

async function testSpringBoot(backend) {
  const tests = [];

  // Test basic health check
  const healthCheck = await makeRequest("localhost", 8080, "/health");
  tests.push({
    name: "Health endpoint responds",
    status: healthCheck.success ? "passed" : "failed",
    statusCode: healthCheck.statusCode,
    error: healthCheck.error
  });

  // Try common API endpoints
  const endpoints = [
    { path: "/api/todos", method: "GET", name: "GET /api/todos" },
    { path: "/api/health", method: "GET", name: "GET /api/health" },
    { path: "/actuator/health", method: "GET", name: "GET /actuator/health" }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest("localhost", 8080, endpoint.path, endpoint.method);
    tests.push({
      name: endpoint.name,
      status: result.success ? "passed" : "failed",
      statusCode: result.statusCode,
      error: result.error
    });
  }

  return tests;
}

async function testNodeJs(backend) {
  const tests = [];

  // Test basic health check
  const healthCheck = await makeRequest("localhost", 3001, "/health");
  tests.push({
    name: "Health endpoint responds",
    status: healthCheck.success ? "passed" : "failed",
    statusCode: healthCheck.statusCode,
    error: healthCheck.error
  });

  // Try common API endpoints
  const endpoints = [
    { path: "/api/todos", method: "GET", name: "GET /api/todos" },
    { path: "/health", method: "GET", name: "GET /health" }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest("localhost", 3001, endpoint.path, endpoint.method);
    tests.push({
      name: endpoint.name,
      status: result.success ? "passed" : "failed",
      statusCode: result.statusCode,
      error: result.error
    });
  }

  return tests;
}

async function test(projectDir, backend, options = {}) {
  const timeout = options.timeout || 30000;
  let tests = [];

  try {
    if (backend === "spring-boot") {
      tests = await testSpringBoot(backend);
    } else if (backend === "node-js") {
      tests = await testNodeJs(backend);
    } else {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 1,
        tests: [
          {
            name: `API testing for ${backend} not implemented`,
            status: "skipped"
          }
        ]
      };
    }

    const passed = tests.filter((t) => t.status === "passed").length;
    const failed = tests.filter((t) => t.status === "failed").length;

    return {
      total: tests.length,
      passed,
      failed,
      tests
    };
  } catch (err) {
    return {
      total: 0,
      passed: 0,
      failed: 1,
      tests: [
        {
          name: "API testing error",
          status: "failed",
          error: err.message
        }
      ]
    };
  }
}

module.exports = { test };
