/**
 * E-Ra IoT System Diagnostic
 *
 * This script diagnoses the current state of your E-Ra IoT integration
 * and provides specific steps to fix any issues.
 *
 * Usage: node diagnose-era-system.js
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

class EraSystemDiagnostic {
  constructor() {
    this.configPath = path.join(__dirname, "config.json");
    this.issues = [];
    this.recommendations = [];
    this.config = null;
  }

  async runDiagnostic() {
    console.log("🔍 E-Ra IoT System Diagnostic");
    console.log("============================");
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    try {
      // Step 1: Check configuration file
      await this.checkConfigFile();

      // Step 2: Validate AUTHTOKEN
      await this.validateAuthToken();

      // Step 3: Test API connectivity
      await this.testApiConnectivity();

      // Step 4: Check sensor endpoints
      await this.checkSensorEndpoints();

      // Step 5: Verify application integration
      await this.checkApplicationIntegration();

      // Step 6: Generate report
      this.generateReport();
    } catch (error) {
      console.error("💥 Diagnostic failed:", error.message);
    }
  }

  async checkConfigFile() {
    console.log("1️⃣ Configuration File Check");
    console.log("─".repeat(30));

    if (!fs.existsSync(this.configPath)) {
      this.issues.push("❌ config.json file not found");
      this.recommendations.push("Run: npm run dev (to create initial config)");
      console.log("   ❌ config.json not found");
      return;
    }

    try {
      const configContent = fs.readFileSync(this.configPath, "utf-8");
      this.config = JSON.parse(configContent);
      console.log("   ✅ config.json loaded successfully");

      // Check if E-Ra IoT config exists
      if (!this.config.eraIot) {
        this.issues.push("❌ E-Ra IoT configuration missing from config.json");
        this.recommendations.push(
          "Open billboard app and configure E-Ra IoT settings"
        );
        console.log("   ❌ E-Ra IoT section missing");
        return;
      }

      console.log("   ✅ E-Ra IoT configuration found");
      console.log(
        `   📊 Status: ${this.config.eraIot.enabled ? "Enabled" : "Disabled"}`
      );
    } catch (error) {
      this.issues.push("❌ config.json is corrupted or invalid JSON");
      this.recommendations.push("Backup and recreate config.json file");
      console.log("   ❌ Invalid JSON in config file");
    }
  }

  async validateAuthToken() {
    console.log("\n2️⃣ AUTHTOKEN Validation");
    console.log("─".repeat(30));

    if (!this.config?.eraIot?.authToken) {
      this.issues.push("❌ AUTHTOKEN not configured");
      this.recommendations.push(
        "Run: node setup-era-token.js (to set your AUTHTOKEN)"
      );
      console.log("   ❌ AUTHTOKEN missing");
      return;
    }

    const token = this.config.eraIot.authToken;

    if (token.includes("1234272955")) {
      this.issues.push("❌ Using placeholder AUTHTOKEN");
      this.recommendations.push(
        "Replace with your real AUTHTOKEN from E-Ra platform"
      );
      console.log("   ❌ Placeholder token detected");
      return;
    }

    if (!token.startsWith("Token ")) {
      this.issues.push("❌ AUTHTOKEN format incorrect");
      this.recommendations.push(
        'Ensure format: "Token your_actual_token_here"'
      );
      console.log("   ❌ Invalid token format");
      return;
    }

    if (token.length < 30) {
      this.issues.push("⚠️ AUTHTOKEN appears too short");
      this.recommendations.push("Verify token is complete and correct");
      console.log("   ⚠️ Token may be incomplete");
      return;
    }

    console.log("   ✅ AUTHTOKEN format valid");
    console.log(`   📝 Length: ${token.length} characters`);
  }

  async testApiConnectivity() {
    console.log("\n3️⃣ API Connectivity Test");
    console.log("─".repeat(30));

    if (
      !this.config?.eraIot?.authToken ||
      this.config.eraIot.authToken.includes("1234272955")
    ) {
      console.log("   ⏭️ Skipping - invalid AUTHTOKEN");
      return;
    }

    const authMethods = [
      {
        name: "Standard",
        headers: { Authorization: this.config.eraIot.authToken },
      },
      {
        name: "Bearer",
        headers: {
          Authorization: `Bearer ${this.config.eraIot.authToken.replace(
            "Token ",
            ""
          )}`,
        },
      },
    ];

    let connectionWorking = false;

    for (const method of authMethods) {
      try {
        console.log(`   Testing ${method.name} authentication...`);

        const response = await axios.get(
          `${this.config.eraIot.baseUrl}/api/chip_manager/configs/${this.config.eraIot.sensorConfigs.temperature}/current_value/`,
          {
            headers: {
              ...method.headers,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: 10000,
          }
        );

        console.log(`   ✅ ${method.name}: HTTP ${response.status}`);
        connectionWorking = true;
        this.workingAuthMethod = method.name;
        break;
      } catch (error) {
        const status = error.response?.status || "Network Error";
        console.log(`   ❌ ${method.name}: ${status}`);
      }
    }

    if (!connectionWorking) {
      this.issues.push(
        "❌ API connection failed with all authentication methods"
      );
      this.recommendations.push(
        "Verify AUTHTOKEN is valid and has correct permissions"
      );
      this.recommendations.push(
        "Check internet connection and API server status"
      );
    }
  }

  async checkSensorEndpoints() {
    console.log("\n4️⃣ Sensor Endpoints Check");
    console.log("─".repeat(30));

    if (
      !this.config?.eraIot ||
      this.issues.some((issue) => issue.includes("API connection failed"))
    ) {
      console.log("   ⏭️ Skipping - API connection not available");
      return;
    }

    const sensors = this.config.eraIot.sensorConfigs;
    let workingSensors = 0;

    for (const [sensorName, configId] of Object.entries(sensors)) {
      try {
        console.log(`   Testing ${sensorName} (ID: ${configId})...`);

        const response = await axios.get(
          `${this.config.eraIot.baseUrl}/api/chip_manager/configs/${configId}/current_value/`,
          {
            headers: {
              Authorization: this.config.eraIot.authToken,
              "Content-Type": "application/json",
            },
            timeout: 8000,
          }
        );

        // Try to extract a value
        const value = this.extractTestValue(response.data);
        if (value !== null) {
          console.log(`   ✅ ${sensorName}: ${value}`);
          workingSensors++;
        } else {
          console.log(`   ⚠️ ${sensorName}: No value extracted`);
        }
      } catch (error) {
        console.log(
          `   ❌ ${sensorName}: ${error.response?.status || error.message}`
        );
      }
    }

    console.log(`   📊 Summary: ${workingSensors}/4 sensors working`);

    if (workingSensors === 0) {
      this.issues.push("❌ No sensors returning valid data");
      this.recommendations.push(
        "Check sensor config IDs match your E-Ra device setup"
      );
      this.recommendations.push(
        "Verify sensors are online and configured in E-Ra platform"
      );
    } else if (workingSensors < 4) {
      this.issues.push(`⚠️ Only ${workingSensors}/4 sensors working`);
      this.recommendations.push("Check failed sensors in E-Ra platform");
    }
  }

  extractTestValue(data) {
    if (typeof data === "number") return data;
    if (data?.current_value_only && typeof data.current_value_only === "number")
      return data.current_value_only;
    if (data?.current_value && typeof data.current_value === "number")
      return data.current_value;
    if (data?.value && typeof data.value === "number") return data.value;
    if (Array.isArray(data) && data[0]?.current_value_only)
      return data[0].current_value_only;
    if (Array.isArray(data) && data[0]?.current_value)
      return data[0].current_value;
    if (Array.isArray(data) && data[0]?.value) return data[0].value;
    return null;
  }

  async checkApplicationIntegration() {
    console.log("\n5️⃣ Application Integration Check");
    console.log("─".repeat(30));

    // Check if service files exist
    const serviceFile = path.join(
      __dirname,
      "renderer",
      "services",
      "eraIotService.ts"
    );
    if (fs.existsSync(serviceFile)) {
      console.log("   ✅ E-Ra IoT service file exists");
    } else {
      this.issues.push("❌ E-Ra IoT service file missing");
      console.log("   ❌ Service file not found");
    }

    // Check component files
    const componentFiles = [
      "renderer/components/BillboardLayout.tsx",
      "renderer/components/IoTPanel.tsx",
      "renderer/components/EraIotConfig.tsx",
    ];

    for (const file of componentFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${path.basename(file)} exists`);
      } else {
        this.issues.push(`❌ ${path.basename(file)} missing`);
        console.log(`   ❌ ${path.basename(file)} not found`);
      }
    }

    // Check if E-Ra IoT is enabled in config
    if (this.config?.eraIot?.enabled) {
      console.log("   ✅ E-Ra IoT is enabled in configuration");
    } else {
      this.issues.push("⚠️ E-Ra IoT is disabled in configuration");
      this.recommendations.push(
        "Enable E-Ra IoT in the billboard app settings"
      );
      console.log("   ⚠️ E-Ra IoT disabled in config");
    }
  }

  generateReport() {
    console.log("\n" + "=".repeat(50));
    console.log("DIAGNOSTIC REPORT SUMMARY");
    console.log("=".repeat(50));

    // Overall status
    if (this.issues.length === 0) {
      console.log("🎉 SYSTEM STATUS: ✅ ALL GOOD");
      console.log("\nYour E-Ra IoT integration is fully functional!");
      console.log("\n🚀 Ready to run: npm run dev");
    } else if (this.issues.filter((i) => i.includes("❌")).length === 0) {
      console.log("⚠️ SYSTEM STATUS: MINOR ISSUES");
      console.log("\nSystem mostly working with minor issues to resolve.");
    } else {
      console.log("❌ SYSTEM STATUS: CRITICAL ISSUES");
      console.log("\nCritical issues found that prevent proper operation.");
    }

    // List all issues
    if (this.issues.length > 0) {
      console.log("\n🔍 Issues Found:");
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // List recommendations
    if (this.recommendations.length > 0) {
      console.log("\n🔧 Recommended Actions:");
      this.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log("\n📚 Quick Reference:");
    console.log("   • Setup token: node setup-era-token.js");
    console.log("   • Test API: node test-era-api-comprehensive.js");
    console.log("   • Verify system: node test-era-iot-verification.js");
    console.log("   • Start app: npm run dev");

    console.log(
      `\n📝 Full diagnostic completed at ${new Date().toISOString()}`
    );

    // Save diagnostic report
    const reportPath = path.join(__dirname, "era-diagnostic-report.json");
    const report = {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      recommendations: this.recommendations,
      config: this.config?.eraIot || null,
      workingAuthMethod: this.workingAuthMethod || null,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);
  }
}

// Execute diagnostic
async function runDiagnostic() {
  const diagnostic = new EraSystemDiagnostic();
  await diagnostic.runDiagnostic();
}

if (require.main === module) {
  runDiagnostic().catch(console.error);
}

module.exports = EraSystemDiagnostic;
