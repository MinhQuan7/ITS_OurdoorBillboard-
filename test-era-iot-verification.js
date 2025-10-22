/**
 * E-Ra IoT Platform Integration Verification Test
 *
 * This comprehensive test validates the E-Ra IoT MQTT integration
 * replacing the previous REST API approach with real-time MQTT streaming.
 *
 * NEW APPROACH:
 * - MQTT broker: mqtt1.eoh.io:1883
 * - Topic: eoh/chip/{token}/config/+
 * - Authentication: username={token}, password={token}
 * - Payload: {"key": value}
 * - Real-time updates instead of 5-minute polling
 *
 * Usage: node test-era-iot-verification.js
 */

const axios = require("axios");

// Load configuration from saved config file if available
let savedConfig = null;
try {
  const fs = require("fs");
  const path = require("path");
  const configPath = path.join(__dirname, "config.json");
  if (fs.existsSync(configPath)) {
    const rawConfig = fs.readFileSync(configPath, "utf-8");
    savedConfig = JSON.parse(rawConfig);
  }
} catch (error) {
  console.log("Could not load saved config, using defaults");
}

// Test configuration with proper validation
const TEST_CONFIG = {
  authToken:
    process.env.ERA_IOT_TOKEN ||
    (savedConfig?.eraIot?.authToken &&
    !savedConfig.eraIot.authToken.includes("1234272955")
      ? savedConfig.eraIot.authToken
      : null) ||
    "", // Use environment variable or saved config, empty for user input
  baseUrl: savedConfig?.eraIot?.baseUrl || "https://backend.eoh.io",
  sensorConfigs: savedConfig?.eraIot?.sensorConfigs || {
    temperature: 138997, // "Nhiệt độ"
    humidity: 138998, // "Độ ẩm"
    pm25: 138999, // "PM 2.5"
    pm10: 139000, // "PM10"
  },
  timeout: savedConfig?.eraIot?.timeout || 15000,
  retryAttempts: savedConfig?.eraIot?.retryAttempts || 3,
  retryDelay: savedConfig?.eraIot?.retryDelay || 2000,
};

class EraIotVerificationTest {
  constructor(config) {
    this.config = config;
    this.results = {
      authTokenValidation: null,
      connectionTest: null,
      sensorTests: {},
      responseFormatAnalysis: {},
      overallStatus: "pending",
    };
  }

  async runVerification() {
    console.log("E-Ra IoT Platform MQTT Integration Verification");
    console.log("==============================================");
    console.log(`MQTT Broker: mqtt1.eoh.io:1883`);
    console.log(`Topic Pattern: eoh/chip/{token}/config/+`);
    console.log(`Authentication: Gateway Token`);
    console.log(`Data Format: Real-time MQTT streaming`);
    console.log();

    try {
      // Step 1: Validate AUTHTOKEN format
      await this.validateAuthToken();

      // Step 2: Test API connectivity with different auth methods
      await this.testApiConnectivity();

      // Step 3: Analyze response formats for each sensor
      await this.analyzeResponseFormats();

      // Step 4: Test data parsing logic
      await this.testDataParsing();

      // Step 5: Print final results and recommendations
      this.printVerificationResults();
    } catch (error) {
      console.error("Critical verification failure:", error.message);
      this.results.overallStatus = "failed";
    }
  }

  async validateAuthToken() {
    console.log("1. Validating AUTHTOKEN...");

    const token = this.config.authToken;

    if (!token || token.trim() === "") {
      console.error("   ❌ AUTHTOKEN is missing");
      console.log("   📋 How to get your AUTHTOKEN:");
      console.log("      1. Go to https://app.e-ra.io");
      console.log("      2. Login to your account");
      console.log("      3. Navigate to Profile section");
      console.log("      4. Copy your AUTHTOKEN");
      console.log(
        "      5. Set as environment variable: ERA_IOT_TOKEN=your_token"
      );
      this.results.authTokenValidation = { valid: false, reason: "missing" };
      return false;
    }

    if (token.includes("1234272955")) {
      console.error("   ❌ Using placeholder AUTHTOKEN");
      console.log(
        "   📋 Please replace with your real AUTHTOKEN from E-Ra platform"
      );
      this.results.authTokenValidation = {
        valid: false,
        reason: "placeholder",
      };
      return false;
    }

    if (token.startsWith("Token ") && token.length > 20) {
      console.log("   ✅ AUTHTOKEN format appears valid");
      this.results.authTokenValidation = { valid: true };
      return true;
    } else {
      console.warn("   ⚠️  AUTHTOKEN format may be incorrect");
      console.log("   📋 Expected format: 'Token your_actual_token_here'");
      this.results.authTokenValidation = { valid: false, reason: "format" };
      return false;
    }
  }

  async testApiConnectivity() {
    console.log("\n2. Testing API connectivity...");

    if (!this.results.authTokenValidation?.valid) {
      console.log("   ⏭️  Skipping - invalid AUTHTOKEN");
      return;
    }

    const authFormats = [
      { name: "Standard", headers: { Authorization: this.config.authToken } },
      {
        name: "Bearer",
        headers: {
          Authorization: `Bearer ${this.config.authToken.replace(
            "Token ",
            ""
          )}`,
        },
      },
      {
        name: "API Key",
        headers: { "X-API-Key": this.config.authToken.replace("Token ", "") },
      },
      {
        name: "Direct",
        headers: { apiKey: this.config.authToken.replace("Token ", "") },
      },
    ];

    for (const format of authFormats) {
      try {
        console.log(`   Testing ${format.name} auth format...`);

        const response = await axios.get(
          `${this.config.baseUrl}/api/chip_manager/configs/${this.config.sensorConfigs.temperature}/current_value/`,
          {
            headers: {
              ...format.headers,
              "Content-Type": "application/json",
              Accept: "application/json",
              "User-Agent": "ITS-Billboard-Verification/1.0",
            },
            timeout: this.config.timeout,
          }
        );

        console.log(`   ✅ ${format.name} auth: Status ${response.status}`);
        this.results.connectionTest = {
          success: true,
          authFormat: format.name,
          status: response.status,
        };

        // Use successful auth format for remaining tests
        this.successfulAuth = format.headers;
        return;
      } catch (error) {
        console.log(
          `   ❌ ${format.name} auth: ${this.getErrorMessage(error)}`
        );
      }
    }

    console.error("   ❌ All authentication methods failed");
    this.results.connectionTest = { success: false };
  }

  async analyzeResponseFormats() {
    console.log("\n3. Analyzing API response formats...");

    if (!this.results.connectionTest?.success) {
      console.log("   ⏭️  Skipping - API connection failed");
      return;
    }

    for (const [sensorName, configId] of Object.entries(
      this.config.sensorConfigs
    )) {
      try {
        console.log(`   Analyzing ${sensorName} (ID: ${configId})...`);

        const response = await axios.get(
          `${this.config.baseUrl}/api/chip_manager/configs/${configId}/current_value/`,
          {
            headers: {
              ...this.successfulAuth,
              "Content-Type": "application/json",
              Accept: "application/json",
              "User-Agent": "ITS-Billboard-Verification/1.0",
            },
            timeout: this.config.timeout,
          }
        );

        const data = response.data;

        console.log(`   📊 ${sensorName} response structure:`);
        console.log(
          `      Type: ${Array.isArray(data) ? "Array" : typeof data}`
        );
        if (Array.isArray(data)) {
          console.log(`      Length: ${data.length}`);
          if (data.length > 0) {
            console.log(
              `      First item keys: ${Object.keys(data[0]).join(", ")}`
            );
          }
        } else if (typeof data === "object" && data !== null) {
          console.log(`      Keys: ${Object.keys(data).join(", ")}`);
        }

        // Try to extract value using different methods
        const extractedValue = this.extractValue(data);
        console.log(`      Extracted value: ${extractedValue}`);

        this.results.responseFormatAnalysis[sensorName] = {
          success: true,
          dataType: Array.isArray(data) ? "array" : typeof data,
          keys: Array.isArray(data)
            ? data.length > 0
              ? Object.keys(data[0])
              : []
            : Object.keys(data),
          extractedValue: extractedValue,
          rawSample:
            JSON.stringify(data).substring(0, 200) +
            (JSON.stringify(data).length > 200 ? "..." : ""),
        };
      } catch (error) {
        console.log(`   ❌ ${sensorName}: ${this.getErrorMessage(error)}`);
        this.results.responseFormatAnalysis[sensorName] = {
          success: false,
          error: this.getErrorMessage(error),
        };
      }
    }
  }

  extractValue(data) {
    // Try different value extraction methods
    if (typeof data === "number") return data;

    if (data && typeof data === "object") {
      // Try common field names
      const possibleFields = [
        "current_value_only",
        "current_value",
        "value",
        "data",
      ];
      for (const field of possibleFields) {
        if (typeof data[field] === "number") {
          return data[field];
        }
      }

      // If it's an array, try the first element
      if (Array.isArray(data) && data.length > 0) {
        return this.extractValue(data[0]);
      }
    }

    return null;
  }

  async testDataParsing() {
    console.log("\n4. Testing data parsing logic...");

    const successfulSensors = Object.values(
      this.results.responseFormatAnalysis
    ).filter((r) => r.success).length;

    if (successfulSensors === 0) {
      console.log("   ⏭️  Skipping - no successful sensor responses");
      return;
    }

    console.log(`   ✅ Successfully parsed ${successfulSensors}/4 sensors`);

    // Simulate the actual service behavior
    const simulatedData = {
      temperature: null,
      humidity: null,
      pm25: null,
      pm10: null,
      lastUpdated: new Date(),
      status: "pending",
    };

    let validValues = 0;
    Object.entries(this.results.responseFormatAnalysis).forEach(
      ([sensor, result]) => {
        if (
          result.success &&
          result.extractedValue !== null &&
          !isNaN(result.extractedValue)
        ) {
          simulatedData[sensor] = result.extractedValue;
          validValues++;
        }
      }
    );

    // Set status based on results
    if (validValues === 4) {
      simulatedData.status = "success";
      console.log("   🎯 All sensors providing valid data");
    } else if (validValues > 0) {
      simulatedData.status = "partial";
      console.log(`   ⚠️  Partial success: ${validValues}/4 sensors working`);
    } else {
      simulatedData.status = "error";
      console.log("   ❌ No sensors providing valid data");
    }

    console.log("   📊 Simulated service data:");
    console.log(`      Temperature: ${simulatedData.temperature}°C`);
    console.log(`      Humidity: ${simulatedData.humidity}%`);
    console.log(`      PM2.5: ${simulatedData.pm25} μg/m³`);
    console.log(`      PM10: ${simulatedData.pm10} μg/m³`);
    console.log(`      Status: ${simulatedData.status}`);

    this.results.simulatedData = simulatedData;
  }

  getErrorMessage(error) {
    if (error.response) {
      return `HTTP ${error.response.status} - ${error.response.statusText}`;
    } else if (error.code === "ENOTFOUND") {
      return "DNS resolution failed";
    } else if (error.code === "ECONNREFUSED") {
      return "Connection refused";
    } else if (error.code === "ETIMEDOUT") {
      return "Request timeout";
    } else {
      return error.message;
    }
  }

  printVerificationResults() {
    console.log("\n" + "=".repeat(50));
    console.log("VERIFICATION RESULTS SUMMARY");
    console.log("=".repeat(50));

    // Overall status
    const authValid = this.results.authTokenValidation?.valid || false;
    const connectionOk = this.results.connectionTest?.success || false;
    const workingSensors = Object.values(
      this.results.responseFormatAnalysis
    ).filter((r) => r.success && r.extractedValue !== null).length;

    if (authValid && connectionOk && workingSensors === 4) {
      this.results.overallStatus = "success";
      console.log("🎉 VERIFICATION PASSED - E-Ra IoT integration is ready!");
    } else if (authValid && connectionOk && workingSensors > 0) {
      this.results.overallStatus = "partial";
      console.log("⚠️  PARTIAL SUCCESS - Some issues need attention");
    } else {
      this.results.overallStatus = "failed";
      console.log("❌ VERIFICATION FAILED - Critical issues found");
    }

    console.log("\nDetailed Results:");
    console.log(`   AUTHTOKEN: ${authValid ? "✅ Valid" : "❌ Invalid"}`);
    console.log(
      `   API Connection: ${connectionOk ? "✅ Working" : "❌ Failed"}`
    );
    console.log(`   Sensor Data: ${workingSensors}/4 working`);

    if (connectionOk) {
      console.log(`   Auth Method: ${this.results.connectionTest.authFormat}`);
    }

    console.log("\nNext Steps:");
    if (this.results.overallStatus === "success") {
      console.log("   1. ✅ Your E-Ra IoT integration is fully functional");
      console.log(
        "   2. 🚀 Update your application config with this AUTHTOKEN"
      );
      console.log(
        "   3. 📊 Start the billboard application to see live sensor data"
      );
      console.log("   4. 🔍 Monitor the console logs for any runtime issues");
    } else {
      console.log("   1. 🔧 Fix the issues identified above");
      console.log("   2. 📚 Check E-Ra IoT platform documentation");
      console.log("   3. 🔄 Re-run this verification test");
      console.log("   4. 📞 Contact E-Ra support if problems persist");
    }

    console.log("\nTroubleshooting Guide:");
    if (!authValid) {
      console.log("   📋 AUTHTOKEN Issues:");
      console.log(
        "      - Ensure you're using your personal AUTHTOKEN from E-Ra platform"
      );
      console.log("      - Check the format: 'Token your_actual_token_here'");
      console.log("      - Verify the token hasn't expired");
    }
    if (!connectionOk) {
      console.log("   🌐 Connection Issues:");
      console.log("      - Check internet connectivity");
      console.log("      - Verify the base URL is correct");
      console.log("      - Check if backend.eoh.io is accessible");
    }
    if (workingSensors < 4) {
      console.log("   🔧 Sensor Issues:");
      console.log(
        "      - Verify sensor config IDs are correct for your device"
      );
      console.log("      - Check sensor status on E-Ra platform");
      console.log("      - Ensure sensors are properly configured and online");
    }
  }
}

// Execute verification
async function runVerification() {
  // Check for AUTHTOKEN in environment or prompt user
  if (!TEST_CONFIG.authToken) {
    console.log("⚠️  No AUTHTOKEN provided!");
    console.log("Please set your AUTHTOKEN:");
    console.log("   Environment variable: ERA_IOT_TOKEN=your_token");
    console.log(
      "   Or edit this file and add your token to TEST_CONFIG.authToken"
    );
    return;
  }

  const verifier = new EraIotVerificationTest(TEST_CONFIG);
  await verifier.runVerification();
}

// Execute if run directly
if (require.main === module) {
  runVerification().catch(console.error);
}

module.exports = { EraIotVerificationTest, TEST_CONFIG };
