const http = require("http");

function makeRequest(host, port, path, timeout = 5000) {
  return new Promise((resolve) => {
    const options = {
      host,
      port,
      path,
      method: "GET",
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
          isHtml: res.headers["content-type"]?.includes("text/html"),
          data: data.substring(0, 100) // First 100 chars
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: null,
        success: false,
        isHtml: false,
        error: err.message
      });
    });

    req.on("timeout", () => {
      req.abort();
      resolve({
        statusCode: null,
        success: false,
        isHtml: false,
        error: "Request timeout"
      });
    });

    req.end();
  });
}

async function test(projectDir, options = {}) {
  const timeout = options.timeout || 30000;
  const tests = [];

  // Try common frontend ports
  const ports = [
    { port: 3000, name: "React/Node (port 3000)" },
    { port: 4200, name: "Angular (port 4200)" },
    { port: 80, name: "Nginx (port 80)" },
    { port: 8080, name: "Nginx/Web (port 8080)" }
  ];

  let foundWorkingPort = null;

  for (const { port, name } of ports) {
    const result = await makeRequest("localhost", port, "/", timeout);
    const passed = result.success && (result.isHtml || result.statusCode === 200);

    tests.push({
      name: `Frontend accessible on ${name}`,
      status: passed ? "passed" : "failed",
      statusCode: result.statusCode,
      error: result.error
    });

    if (passed && !foundWorkingPort) {
      foundWorkingPort = port;
    }
  }

  // If we found a working port, try to access some common application paths
  if (foundWorkingPort) {
    const appPaths = ["/", "/index.html", "/app"];
    for (const appPath of appPaths) {
      const result = await makeRequest("localhost", foundWorkingPort, appPath, timeout);
      if (result.success) {
        tests.push({
          name: `Application path ${appPath} accessible`,
          status: "passed",
          statusCode: result.statusCode
        });
        break; // Only test first successful path
      }
    }
  }

  const passed = tests.filter((t) => t.status === "passed").length;
  const failed = tests.filter((t) => t.status === "failed").length;

  return {
    accessible: passed > 0,
    total: tests.length,
    passed,
    failed,
    tests
  };
}

module.exports = { test };
