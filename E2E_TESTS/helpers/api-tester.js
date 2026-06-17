const http = require("http");

function makeRequest(host, port, path, method = "GET", timeout = 5000, body = null) {
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

    if (body) {
      req.setHeader("Content-Type", "application/json");
      req.write(body);
    }

    req.on("error", (err) => {
      resolve({
        statusCode: null,
        success: false,
        error: err.message
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        statusCode: null,
        success: false,
        error: "Request timeout"
      });
    });

    req.end();
  });
}

function parseJsonBody(data) {
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function testSpringBoot(backend, timeout = 5000) {
  const tests = [];
  const apiPort = Number(process.env.BENCHMARK_API_PORT || 8080);

  // Test the todo API contract exposed by the generated Spring Boot app.
  const listResponse = await makeRequest("localhost", apiPort, "/api/todos", "GET", timeout);
  tests.push({
    name: "GET /api/todos",
    status: listResponse.success && Array.isArray(parseJsonBody(listResponse.data)) ? "passed" : "failed",
    statusCode: listResponse.statusCode,
    error: listResponse.error
  });

  const createResponse = await makeRequest(
    "localhost",
    apiPort,
    "/api/todos",
    "POST",
    timeout,
    JSON.stringify({
      title: "Evaluator smoke todo",
      description: "Created by the benchmark API probe",
      completed: false
    })
  );
  tests.push({
    name: "POST /api/todos",
    status: createResponse.success ? "passed" : "failed",
    statusCode: createResponse.statusCode,
    error: createResponse.error
  });

  const createdTodo = parseJsonBody(createResponse.data);
  if (createdTodo && createdTodo.id != null) {
    const detailResponse = await makeRequest("localhost", apiPort, `/api/todos/${createdTodo.id}`, "GET", timeout);
    tests.push({
      name: `GET /api/todos/${createdTodo.id}`,
      status: detailResponse.success ? "passed" : "failed",
      statusCode: detailResponse.statusCode,
      error: detailResponse.error
    });

    const deleteResponse = await makeRequest(
      "localhost",
      apiPort,
      `/api/todos/${createdTodo.id}`,
      "DELETE",
      timeout
    );
    tests.push({
      name: `DELETE /api/todos/${createdTodo.id}`,
      status: deleteResponse.success ? "passed" : "failed",
      statusCode: deleteResponse.statusCode,
      error: deleteResponse.error
    });
  } else {
    const missingIdError = "POST /api/todos did not return a usable id";
    tests.push({
      name: "GET /api/todos/{id}",
      status: "failed",
      statusCode: createResponse.statusCode,
      error: missingIdError
    });
    tests.push({
      name: "DELETE /api/todos/{id}",
      status: "failed",
      statusCode: createResponse.statusCode,
      error: missingIdError
    });
  }

  return tests;
}

async function testNodeJs(backend, timeout = 5000) {
  const tests = [];
  const port = Number(process.env.BENCHMARK_API_PORT || 3001);

  // Test basic health check
  const healthCheck = await makeRequest("localhost", port, "/health", "GET", timeout);
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
    const result = await makeRequest("localhost", port, endpoint.path, endpoint.method, timeout);
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
      tests = await testSpringBoot(backend, timeout);
    } else if (backend === "node-js") {
      tests = await testNodeJs(backend, timeout);
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
