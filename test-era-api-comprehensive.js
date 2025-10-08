/**
 * Comprehensive E-Ra IoT API Test
 *
 * This script tests the E-Ra IoT API endpoints comprehensively
 * and provides detailed analysis of response formats.
 *
 * Usage: node test-era-api-comprehensive.js
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Load configuration
const configPath = path.join(__dirname, "config.json");
let savedConfig = null;
try {
  if (fs.existsSync(configPath)) {
    savedConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (error) {
  console.log("Could not load saved config");
}

const API_CONFIG = {
  baseUrl: "https://backend.eoh.io",
  authToken: process.env.ERA_IOT_TOKEN || savedConfig?.eraIot?.authToken || "",
  sensorConfigs: savedConfig?.eraIot?.sensorConfigs || {
    temperature: 138997,
    humidity: 138998,
    pm25: 138999,
    pm10: 139000,
  },
  timeout: 15000,
};

class EraApiTester {
  constructor(config) {
    this.config = config;
    this.results = {
      authMethods: {},
      endpoints: {},
      sensorData: {},
      recommendations: [],
    };
  }

  async runComprehensiveTest() {
    console.log("🔍 E-Ra IoT API Comprehensive Test");
    console.log("=================================");
    console.log(`Base URL: ${this.config.baseUrl}`);
    console.log(
      `Auth Token: ${this.config.authToken ? "Provided" : "Missing"}`
    );
    console.log();

    if (
      !this.config.authToken ||
      this.config.authToken.includes("1234272955")
    ) {
      console.error("❌ Valid AUTHTOKEN required");
      console.log("💡 Run: node setup-era-token.js (to set up your token)");
      return;
    }

    try {
      // Step 1: Test different authentication methods
      await this.testAuthenticationMethods();

      // Step 2: Test each sensor endpoint
      await this.testSensorEndpoints();

      // Step 3: Analyze data formats and create parsing logic
      await this.analyzeDataFormats();

      // Step 4: Generate implementation recommendations
      this.generateRecommendations();

      // Step 5: Display results
      this.displayResults();
    } catch (error) {
      console.error("💥 Test execution failed:", error.message);
    }
  }

  async testAuthenticationMethods() {
    console.log("1️⃣ Testing Authentication Methods");
    console.log("─".repeat(40));

    const authMethods = [
      {
        name: "Standard Token",
        headers: { Authorization: this.config.authToken },
      },
      {
        name: "Bearer Token",
        headers: {
          Authorization: `Bearer ${this.config.authToken.replace(
            "Token ",
            ""
          )}`,
        },
      },
      {
        name: "API Key Header",
        headers: { "X-API-Key": this.config.authToken.replace("Token ", "") },
      },
      {
        name: "Custom apiKey",
        headers: { apiKey: this.config.authToken.replace("Token ", "") },
      },
    ];

    for (const method of authMethods) {
      try {
        console.log(`   Testing ${method.name}...`);

        const response = await axios.get(
          `${this.config.baseUrl}/api/chip_manager/configs/${this.config.sensorConfigs.temperature}/current_value/`,
          {
            headers: {
              ...method.headers,
              "Content-Type": "application/json",
              Accept: "application/json",
              "User-Agent": "EraIoT-Tester/1.0",
            },
            timeout: this.config.timeout,
          }
        );

        this.results.authMethods[method.name] = {
          success: true,
          status: response.status,
          responseSize: JSON.stringify(response.data).length,
          headers: method.headers,
        };

        console.log(
          `   ✅ ${method.name}: ${response.status} (${
            JSON.stringify(response.data).length
          } bytes)`
        );

        // Use the first successful method for subsequent tests
        if (!this.workingAuth) {
          this.workingAuth = method.headers;
          this.workingAuthName = method.name;
        }
      } catch (error) {
        this.results.authMethods[method.name] = {
          success: false,
          error: this.parseError(error),
        };
        console.log(`   ❌ ${method.name}: ${this.parseError(error)}`);
      }
    }

    if (this.workingAuth) {
      console.log(`   🎯 Using ${this.workingAuthName} for subsequent tests\n`);
    } else {
      console.log("   💥 No authentication method worked\n");
      throw new Error("Authentication failed for all methods");
    }
  }

  async testSensorEndpoints() {
    console.log("2️⃣ Testing Sensor Endpoints");
    console.log("─".repeat(40));

    for (const [sensorName, configId] of Object.entries(
      this.config.sensorConfigs
    )) {
      try {
        console.log(`   Testing ${sensorName} (Config ID: ${configId})...`);

        const response = await axios.get(
          `${this.config.baseUrl}/api/chip_manager/configs/${configId}/current_value/`,
          {
            headers: {
              ...this.workingAuth,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: this.config.timeout,
          }
        );

        this.results.endpoints[sensorName] = {
          success: true,
          status: response.status,
          configId: configId,
          data: response.data,
          dataType: Array.isArray(response.data)
            ? "array"
            : typeof response.data,
          size: JSON.stringify(response.data).length,
        };

        console.log(
          `   ✅ ${sensorName}: ${response.status} (${typeof response.data})`
        );
      } catch (error) {
        this.results.endpoints[sensorName] = {
          success: false,
          configId: configId,
          error: this.parseError(error),
        };
        console.log(`   ❌ ${sensorName}: ${this.parseError(error)}`);
      }
    }
    console.log();
  }

  async analyzeDataFormats() {
    console.log("3️⃣ Analyzing Data Formats");
    console.log("─".repeat(40));

    for (const [sensorName, result] of Object.entries(this.results.endpoints)) {
      if (!result.success) continue;

      console.log(`   Analyzing ${sensorName}:`);

      const data = result.data;
      let extractedValue = null;
      let extractionMethod = null;

      // Try different extraction methods
      const methods = [
        {
          name: "direct number",
          extract: (d) => (typeof d === "number" ? d : null),
        },
        { name: "current_value_only", extract: (d) => d?.current_value_only },
        { name: "current_value", extract: (d) => d?.current_value },
        { name: "value", extract: (d) => d?.value },
        { name: "data", extract: (d) => d?.data },
        {
          name: "array[0].current_value_only",
          extract: (d) => Array.isArray(d) && d[0]?.current_value_only,
        },
        {
          name: "array[0].current_value",
          extract: (d) => Array.isArray(d) && d[0]?.current_value,
        },
        {
          name: "array[0].value",
          extract: (d) => Array.isArray(d) && d[0]?.value,
        },
      ];

      for (const method of methods) {
        const value = method.extract(data);
        if (typeof value === "number" && !isNaN(value)) {
          extractedValue = value;
          extractionMethod = method.name;
          break;
        }
      }

      this.results.sensorData[sensorName] = {
        rawData: data,
        extractedValue: extractedValue,
        extractionMethod: extractionMethod,
        dataStructure: this.analyzeStructure(data),
      };

      console.log(
        `      Structure: ${this.results.sensorData[sensorName].dataStructure}`
      );
      console.log(
        `      Value: ${extractedValue} (via ${extractionMethod || "failed"})`
      );

      // Show sample of raw data
      const sample = JSON.stringify(data).substring(0, 150);
      console.log(
        `      Raw Sample: ${sample}${
          JSON.stringify(data).length > 150 ? "..." : ""
        }`
      );
    }
    console.log();
  }

  analyzeStructure(data) {
    if (typeof data === "number") return "Direct Number";
    if (typeof data === "string") return "String";
    if (Array.isArray(data)) {
      if (data.length === 0) return "Empty Array";
      return `Array[${data.length}] of ${typeof data[0]}`;
    }
    if (data && typeof data === "object") {
      const keys = Object.keys(data);
      return `Object with keys: [${keys.slice(0, 5).join(", ")}${
        keys.length > 5 ? "..." : ""
      }]`;
    }
    return "Unknown";
  }

  generateRecommendations() {
    const workingEndpoints = Object.values(this.results.endpoints).filter(
      (r) => r.success
    ).length;
    const validSensors = Object.values(this.results.sensorData).filter(
      (r) => r.extractedValue !== null
    ).length;

    this.results.recommendations = [];

    if (workingEndpoints === 4 && validSensors === 4) {
      this.results.recommendations.push(
        "✅ All sensors working perfectly - implementation ready"
      );
    } else if (workingEndpoints > 0) {
      this.results.recommendations.push(
        `⚠️ ${workingEndpoints}/4 endpoints working - check failed sensors`
      );
    }

    if (this.workingAuth) {
      this.results.recommendations.push(
        `🔐 Use ${this.workingAuthName} authentication method`
      );
    }

    // Generate optimal parsing strategy
    const extractionMethods = Object.values(this.results.sensorData)
      .map((r) => r.extractionMethod)
      .filter(Boolean);

    const mostCommonMethod = extractionMethods.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const bestMethod = Object.entries(mostCommonMethod).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    if (bestMethod) {
      this.results.recommendations.push(
        `📊 Recommended parsing method: ${bestMethod}`
      );
    }
  }

  displayResults() {
    console.log("4️⃣ Test Results Summary");
    console.log("═".repeat(50));

    // Authentication Summary
    const workingAuth = Object.entries(this.results.authMethods).filter(
      ([, result]) => result.success
    ).length;
    console.log(`🔐 Authentication: ${workingAuth}/4 methods working`);

    // Endpoint Summary
    const workingEndpoints = Object.entries(this.results.endpoints).filter(
      ([, result]) => result.success
    ).length;
    console.log(`🌐 API Endpoints: ${workingEndpoints}/4 working`);

    // Data Extraction Summary
    const validData = Object.entries(this.results.sensorData).filter(
      ([, result]) => result.extractedValue !== null
    ).length;
    console.log(`📊 Data Extraction: ${validData}/4 successful`);

    console.log("\n📋 Sensor Data:");
    Object.entries(this.results.sensorData).forEach(([sensor, data]) => {
      if (data.extractedValue !== null) {
        console.log(
          `   ${sensor}: ${data.extractedValue} (${data.extractionMethod})`
        );
      } else {
        console.log(`   ${sensor}: ❌ Could not extract value`);
      }
    });

    console.log("\n💡 Recommendations:");
    this.results.recommendations.forEach((rec) => {
      console.log(`   ${rec}`);
    });

    // Generate implementation code
    if (validData > 0) {
      this.generateImplementationCode();
    }
  }

  generateImplementationCode() {
    console.log("\n🔧 Implementation Code:");
    console.log("─".repeat(50));

    // Generate optimized fetch function
    const extractionLogic = Object.entries(this.results.sensorData)
      .map(([sensor, data]) => {
        if (data.extractedValue !== null) {
          return (
            `      // ${sensor}: ${data.extractionMethod}\n` +
            `      if (${this.generateExtractionCode(
              data.extractionMethod,
              "response.data"
            )}) {\n` +
            `        value = ${this.generateExtractionCode(
              data.extractionMethod,
              "response.data"
            )};\n` +
            `      }`
          );
        }
        return null;
      })
      .filter(Boolean);

    console.log("```typescript");
    console.log("// Optimized value extraction based on test results");
    console.log("private extractSensorValue(response: any): number | null {");
    console.log("  let value: number | null = null;");
    console.log("  const data = response.data;");
    console.log("  ");
    console.log("  try {");
    extractionLogic.forEach((logic) => console.log(logic));
    console.log("    ");
    console.log(
      '    return (typeof value === "number" && !isNaN(value)) ? value : null;'
    );
    console.log("  } catch (error) {");
    console.log('    console.error("Value extraction failed:", error);');
    console.log("    return null;");
    console.log("  }");
    console.log("}");
    console.log("```");

    // Save results to file
    const resultsFile = path.join(__dirname, "era-api-test-results.json");
    fs.writeFileSync(
      resultsFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          config: this.config,
          results: this.results,
          workingAuth: this.workingAuth,
          workingAuthName: this.workingAuthName,
        },
        null,
        2
      )
    );

    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  }

  generateExtractionCode(method, dataVar) {
    const methodMap = {
      "direct number": `typeof ${dataVar} === 'number'`,
      current_value_only: `${dataVar}?.current_value_only`,
      current_value: `${dataVar}?.current_value`,
      value: `${dataVar}?.value`,
      data: `${dataVar}?.data`,
      "array[0].current_value_only": `Array.isArray(${dataVar}) && ${dataVar}[0]?.current_value_only`,
      "array[0].current_value": `Array.isArray(${dataVar}) && ${dataVar}[0]?.current_value`,
      "array[0].value": `Array.isArray(${dataVar}) && ${dataVar}[0]?.value`,
    };
    return methodMap[method] || "null";
  }

  parseError(error) {
    if (error.response) {
      return `HTTP ${error.response.status}`;
    } else if (error.code === "ENOTFOUND") {
      return "DNS Failed";
    } else if (error.code === "ETIMEDOUT") {
      return "Timeout";
    } else {
      return error.message;
    }
  }
}

// Execute test
async function runTest() {
  const tester = new EraApiTester(API_CONFIG);
  await tester.runComprehensiveTest();
}

if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = EraApiTester;
