/**
 * E-Ra IoT AUTHTOKEN Setup Helper
 *
 * This script helps you properly configure your E-Ra IoT AUTHTOKEN
 * for the billboard application.
 *
 * Usage: node setup-era-token.js [your-authtoken]
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const configPath = path.join(__dirname, "config.json");

async function promptForToken() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("\n🔐 E-Ra IoT AUTHTOKEN Setup");
    console.log("============================");
    console.log("\n📋 How to get your AUTHTOKEN:");
    console.log("1. Go to https://app.e-ra.io");
    console.log("2. Login to your account");
    console.log("3. Navigate to Profile section");
    console.log("4. Copy your AUTHTOKEN");
    console.log("\n⚠️  Format should be: Token your_actual_token_here");
    console.log("");

    rl.question("Enter your E-Ra IoT AUTHTOKEN: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function validateToken(token) {
  if (!token || token.trim() === "") {
    return { valid: false, message: "AUTHTOKEN cannot be empty" };
  }

  if (token.includes("1234272955")) {
    return {
      valid: false,
      message: "Please use your real AUTHTOKEN, not the placeholder",
    };
  }

  if (!token.startsWith("Token ")) {
    return { valid: false, message: 'AUTHTOKEN must start with "Token "' };
  }

  if (token.length < 20) {
    return { valid: false, message: "AUTHTOKEN appears too short" };
  }

  return { valid: true, message: "AUTHTOKEN format appears valid" };
}

async function updateConfig(authToken) {
  try {
    let config = {};

    // Load existing config if it exists
    if (fs.existsSync(configPath)) {
      const rawConfig = fs.readFileSync(configPath, "utf-8");
      config = JSON.parse(rawConfig);
    }

    // Ensure eraIot config exists
    if (!config.eraIot) {
      config.eraIot = {
        enabled: false,
        authToken: "",
        baseUrl: "https://backend.eoh.io",
        sensorConfigs: {
          temperature: 138997,
          humidity: 138998,
          pm25: 138999,
          pm10: 139000,
        },
        updateInterval: 5,
        timeout: 15000,
        retryAttempts: 3,
        retryDelay: 2000,
      };
    }

    // Update the AUTHTOKEN
    config.eraIot.authToken = authToken;
    config.eraIot.enabled = true; // Enable E-Ra IoT when token is set

    // Write back to config file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log("\n✅ Configuration updated successfully!");
    console.log(`📁 Config saved to: ${configPath}`);

    return true;
  } catch (error) {
    console.error("\n❌ Failed to update configuration:", error.message);
    return false;
  }
}

async function testConnection(authToken) {
  console.log("\n🔍 Testing API connection...");

  try {
    const axios = require("axios");

    const response = await axios.get(
      "https://backend.eoh.io/api/chip_manager/configs/138997/current_value/",
      {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "ITS-Billboard-Setup/1.0",
        },
        timeout: 10000,
      }
    );

    if (response.status === 200) {
      console.log("✅ API connection successful!");
      console.log(
        `📊 Temperature sensor response: ${JSON.stringify(
          response.data
        ).substring(0, 100)}...`
      );
      return true;
    } else {
      console.log(`⚠️  Unexpected response status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(
      "❌ API connection failed:",
      error.response?.status || error.message
    );

    if (error.response?.status === 401) {
      console.log("🔐 Authentication error - please check your AUTHTOKEN");
    } else if (error.response?.status === 403) {
      console.log(
        "🚫 Access forbidden - AUTHTOKEN may not have required permissions"
      );
    } else if (error.response?.status === 404) {
      console.log("🔍 Endpoint not found - sensor config ID may be incorrect");
    }

    return false;
  }
}

async function main() {
  try {
    let authToken = process.argv[2]; // Get token from command line argument

    // If no token provided via command line, prompt user
    if (!authToken) {
      authToken = await promptForToken();
    }

    // Validate the token
    const validation = validateToken(authToken);
    if (!validation.valid) {
      console.error(`\n❌ Invalid AUTHTOKEN: ${validation.message}`);
      process.exit(1);
    }

    console.log(`\n✅ ${validation.message}`);

    // Update configuration
    const configUpdated = await updateConfig(authToken);
    if (!configUpdated) {
      process.exit(1);
    }

    // Test the connection
    const connectionWorking = await testConnection(authToken);

    if (connectionWorking) {
      console.log("\n🎉 Setup completed successfully!");
      console.log("\n📋 Next steps:");
      console.log(
        "1. Run: node test-era-iot-verification.js (to verify everything works)"
      );
      console.log("2. Run: npm run dev (to start the billboard application)");
      console.log("3. Check the IoT panel for live sensor data");
    } else {
      console.log("\n⚠️  Setup completed but connection test failed");
      console.log("\n🔧 Troubleshooting:");
      console.log("1. Verify your AUTHTOKEN is correct");
      console.log("2. Check if your E-Ra IoT device is online");
      console.log("3. Ensure sensor config IDs are correct for your device");
      console.log(
        "4. Run: node test-era-iot-verification.js (for detailed diagnostics)"
      );
    }
  } catch (error) {
    console.error("\n💥 Setup failed:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateToken, updateConfig, testConnection };
