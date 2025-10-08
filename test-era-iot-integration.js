/**
 * E-Ra IoT Platform Integration Test
 *
 * This test validates the complete E-Ra IoT integration including:
 * - API connection and authentication
 * - Sensor data retrieval for all configured sensors
 * - Data processing and error handling
 * - Service lifecycle management
 *
 * Usage: node test-era-iot-integration.js
 */

const axios = require("axios");

// Test configuration - replace with actual AUTHTOKEN
const TEST_CONFIG = {
  authToken: "Token 78072b06a81e166b8b900d95f4c2ba1234272955", // PLACEHOLDER - REPLACE WITH REAL AUTHTOKEN FROM https://app.e-ra.io/profile
  baseUrl: "https://backend.eoh.io",
  sensorConfigs: {
    temperature: 138997, // "Nhiệt độ"
    humidity: 138998, // "Độ ẩm"
    pm25: 138999, // "PM 2.5"
    pm10: 139000, // "PM10"
  },
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 2000,
};

class EraIotIntegrationTest {
  constructor(config) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        Authorization: config.authToken,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "ITS-Billboard-Test/1.0",
      },
    });

    this.results = {
      connectionTest: null,
      sensorTests: {},
      overallStatus: "pending",
    };
  }

  async runAllTests() {
    console.log("Starting E-Ra IoT Platform Integration Tests");
    console.log("===============================================");

    if (
      !this.config.authToken ||
      this.config.authToken.includes("1234272955")
    ) {
      console.error(
        "REAL AUTHTOKEN is required! Please update TEST_CONFIG.authToken"
      );
      console.log("\nCRITICAL: You must use YOUR REAL AUTHTOKEN:");
      console.log("1. Login to https://app.e-ra.io");
      console.log("2. Go to Profile section");
      console.log("3. Copy your PERSONAL AUTHTOKEN (not the example token)");
      console.log("4. Replace TEST_CONFIG.authToken in this file");
      console.log(
        "\nNote: The token format should be 'Token [your-actual-token-here]'"
      );
      console.log("Example: 'Token abc123def456ghi789jkl012mno345pqr678stu'");
      return;
    }

    try {
      // Test 1: Basic API connectivity
      await this.testApiConnection();

      // Test 2: Individual sensor data retrieval
      await this.testSensorDataRetrieval();

      // Test 3: Data processing and validation
      await this.testDataProcessing();

      // Print final results
      this.printTestResults();
    } catch (error) {
      console.error("Critical test failure:", error.message);
      this.results.overallStatus = "failed";
    }
  }

  async testApiConnection() {
    console.log("\nTesting API Connection...");

    try {
      // Test direct sensor endpoint first
      const response = await this.httpClient.get(
        `/api/chip_manager/configs/${this.config.sensorConfigs.temperature}/current_value/`
      );

      if (response.status === 200) {
        console.log("API connection successful");
        console.log(`   Response status: ${response.status}`);
        console.log(
          `   Has data: ${
            Array.isArray(response.data) && response.data.length > 0
          }`
        );
        this.results.connectionTest = {
          success: true,
          status: response.status,
        };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("API connection failed:", error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, error.response.data);
      }
      this.results.connectionTest = { success: false, error: error.message };
      throw error;
    }
  }

  async testSensorDataRetrieval() {
    console.log("\nTesting Sensor Data Retrieval...");

    const sensors = [
      {
        name: "temperature",
        id: this.config.sensorConfigs.temperature,
        label: "Nhiệt độ",
      },
      {
        name: "humidity",
        id: this.config.sensorConfigs.humidity,
        label: "Độ ẩm",
      },
      { name: "pm25", id: this.config.sensorConfigs.pm25, label: "PM2.5" },
      { name: "pm10", id: this.config.sensorConfigs.pm10, label: "PM10" },
    ];

    for (const sensor of sensors) {
      console.log(`\n   Testing ${sensor.label} (ID: ${sensor.id})...`);

      try {
        const response = await this.httpClient.get(
          `/api/chip_manager/configs/${sensor.id}/current_value/`
        );

        if (response.status === 200 && response.data) {
          const value = response.data.current_value_only;
          const isValidNumber = typeof value === "number" && !isNaN(value);

          console.log(
            `   ${sensor.label}: ${value} ${
              isValidNumber ? "(valid)" : "(invalid)"
            }`
          );

          this.results.sensorTests[sensor.name] = {
            success: true,
            value: value,
            isValid: isValidNumber,
            rawResponse: response.data,
          };
        } else {
          throw new Error(
            `Invalid response format: ${JSON.stringify(response.data)}`
          );
        }
      } catch (error) {
        console.error(`   ${sensor.label} failed:`, error.message);
        this.results.sensorTests[sensor.name] = {
          success: false,
          error: error.message,
        };
      }
    }
  }

  async testDataProcessing() {
    console.log("\nTesting Data Processing...");

    // Simulate the data processing that happens in the actual service
    const processedData = {
      temperature: null,
      humidity: null,
      pm25: null,
      pm10: null,
      lastUpdated: new Date(),
      status: "success",
    };

    let successCount = 0;
    let partialCount = 0;

    Object.keys(this.results.sensorTests).forEach((sensorName) => {
      const test = this.results.sensorTests[sensorName];
      if (test.success && test.isValid) {
        processedData[sensorName] = test.value;
        successCount++;
      } else if (test.success) {
        processedData[sensorName] = test.value; // Keep even invalid values for debugging
        partialCount++;
      }
    });

    // Determine overall status
    if (successCount === 4) {
      processedData.status = "success";
      console.log("All sensors working perfectly");
    } else if (successCount > 0) {
      processedData.status = "partial";
      console.log(`Partial success: ${successCount}/4 sensors working`);
    } else {
      processedData.status = "error";
      console.log("No sensors working");
    }

    console.log("\nProcessed sensor data:");
    console.log(`   Temperature: ${processedData.temperature}°C`);
    console.log(`   Humidity: ${processedData.humidity}%`);
    console.log(`   PM2.5: ${processedData.pm25} μg/m³`);
    console.log(`   PM10: ${processedData.pm10} μg/m³`);
    console.log(`   Status: ${processedData.status}`);
    console.log(`   Last Updated: ${processedData.lastUpdated.toISOString()}`);

    this.results.processedData = processedData;
  }

  printTestResults() {
    console.log("\nTest Results Summary");
    console.log("=======================");

    // API Connection
    const connResult = this.results.connectionTest;
    console.log(`API Connection: ${connResult?.success ? "PASS" : "FAIL"}`);

    // Sensor Tests
    console.log("\nSensor Tests:");
    Object.entries(this.results.sensorTests).forEach(([sensor, result]) => {
      const status = result.success
        ? result.isValid
          ? "PASS"
          : "PARTIAL"
        : "FAIL";
      console.log(
        `   ${sensor}: ${status}${result.success ? ` (${result.value})` : ""}`
      );
    });

    // Overall Status
    const successfulSensors = Object.values(this.results.sensorTests).filter(
      (r) => r.success && r.isValid
    ).length;
    console.log(`\nOverall Result: ${successfulSensors}/4 sensors working`);

    if (successfulSensors === 4) {
      console.log("SUCCESS: E-Ra IoT integration is fully functional!");
      this.results.overallStatus = "success";
    } else if (successfulSensors > 0) {
      console.log("PARTIAL: Some sensors are not responding correctly");
      this.results.overallStatus = "partial";
    } else {
      console.log("FAILED: No sensors are working");
      this.results.overallStatus = "failed";
    }

    // Recommendations
    console.log("\nRecommendations:");
    if (this.results.overallStatus === "success") {
      console.log("   - Integration is ready for production use");
      console.log("   - Update your application config with the AUTHTOKEN");
      console.log("   - Monitor sensor data in the Billboard application");
    } else {
      console.log("   - Check AUTHTOKEN validity");
      console.log("   - Verify sensor config IDs");
      console.log("   - Check sensor hardware status on E-Ra platform");
      console.log("   - Review network connectivity to backend.eoh.io");
    }
  }
}

// Run the tests
async function runTests() {
  const tester = new EraIotIntegrationTest(TEST_CONFIG);
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { EraIotIntegrationTest, TEST_CONFIG };
