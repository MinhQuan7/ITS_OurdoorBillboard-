/**
 * Simple E-Ra MQTT Connection Test
 * Tests connection to mqtt1.eoh.io with E-RA format
 */

const fs = require("fs");
const path = require("path");

// Load config
let config = null;
try {
  const configPath = path.join(__dirname, "config.json");
  const rawConfig = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(rawConfig);
} catch (error) {
  console.error("Could not load config:", error.message);
  process.exit(1);
}

// Extract gateway token
function extractGatewayToken(authToken) {
  const tokenMatch = authToken.match(/Token\s+(.+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

const gatewayToken = extractGatewayToken(config.eraIot.authToken);
if (!gatewayToken) {
  console.error("Could not extract gateway token");
  process.exit(1);
}

console.log("E-Ra MQTT Configuration Test");
console.log("============================");
console.log("Broker: mqtt1.eoh.io:1883");
console.log("Username:", gatewayToken.substring(0, 10) + "...");
console.log("Password:", gatewayToken.substring(0, 10) + "...");
console.log("Topic:", `eoh/chip/${gatewayToken}/config/+/value`);
console.log("Sensor configs:", config.eraIot.sensorConfigs);
console.log("");

// Try to require mqtt
let mqtt = null;
try {
  mqtt = require("mqtt");
  console.log("✅ MQTT.js library available");
} catch (error) {
  console.log("❌ MQTT.js library not found. Install with: npm install mqtt");
  console.log("   For testing purposes, showing configuration only.");
  process.exit(0);
}

// Test connection
console.log("Testing connection to E-Ra MQTT broker...");

const client = mqtt.connect("mqtt://mqtt1.eoh.io:1883", {
  username: gatewayToken,
  password: gatewayToken,
  clientId: `test_${gatewayToken}_${Date.now()}`,
  keepalive: 60,
  connectTimeout: 15000,
  clean: true,
});

let connectionTimer = setTimeout(() => {
  console.log("❌ Connection timeout");
  client.end();
  process.exit(1);
}, 20000);

client.on("connect", () => {
  clearTimeout(connectionTimer);
  console.log(" Successfully connected to E-Ra MQTT broker!");

  // Subscribe to test topic
  const testTopic = `eoh/chip/${gatewayToken}/config/+/value`;
  client.subscribe(testTopic, { qos: 1 }, (err) => {
    if (err) {
      console.log(" Failed to subscribe:", err.message);
    } else {
      console.log(" Successfully subscribed to:", testTopic);
      console.log("");
      console.log("Waiting for messages... (Press Ctrl+C to stop)");
      console.log(
        "Expected topic format: eoh/chip/{token}/config/{configId}/value"
      );
      console.log('Expected payload format: {"key": value}');
    }
  });
});

client.on("message", (topic, message) => {
  const messageStr = message.toString();
  console.log(` [${new Date().toLocaleTimeString()}] ${topic}: ${messageStr}`);

  // DEBUG: Show raw message details
  console.log(`      Message Details:`);
  console.log(`      Raw Buffer: [${Array.from(message).join(", ")}]`);
  console.log(`      String Length: ${messageStr.length}`);
  console.log(`      Hex: ${message.toString("hex")}`);

  // Try to parse E-RA format
  try {
    const data = JSON.parse(messageStr);
    console.log("    Parsed as JSON:", data);
    console.log("   Data type:", typeof data);
    console.log("    Keys:", Object.keys(data));

    // Check for "+" parsing requirement
    if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        console.log(`      ${key}: ${value} (type: ${typeof value})`);

        // Check if value contains "+" that needs parsing
        if (typeof value === "string" && value.includes("+")) {
          console.log(`       Found "+" in value, needs parsing: ${value}`);

          // Try different parsing strategies
          const strategies = [
            () => parseFloat(value.replace("+", "")), // Remove +
            () => parseFloat(value), // Direct parse
            () => parseFloat(value.split("+")[0]), // Take before +
            () => parseFloat(value.split("+")[1]), // Take after +
            () => value.split("+").map((v) => parseFloat(v)), // Split and parse both
          ];

          strategies.forEach((strategy, index) => {
            try {
              const result = strategy();
              console.log(
                `         Strategy ${index + 1}: ${JSON.stringify(result)}`
              );
            } catch (error) {
              console.log(
                `         Strategy ${index + 1}: Failed - ${error.message}`
              );
            }
          });
        }
      });
    }

    // Extract config ID from topic
    const configIdMatch = topic.match(/\/config\/(\d+)\/value$/);
    if (configIdMatch) {
      const configId = parseInt(configIdMatch[1]);
      console.log(`    Config ID: ${configId}`);

      // Map to sensor type
      const sensorType = Object.entries(config.eraIot.sensorConfigs).find(
        ([, id]) => id === configId
      )?.[0];

      if (sensorType) {
        console.log(`    Sensor: ${sensorType}`);
      }
    }
  } catch (error) {
    console.log("   ❌ Could not parse as JSON:", error.message);
    console.log("   📝 Trying as plain text...");

    // Try parsing as plain text with "+" handling
    if (messageStr.includes("+")) {
      console.log(`   🎯 Found "+" in plain text: ${messageStr}`);

      const strategies = [
        () => parseFloat(messageStr.replace("+", "")),
        () => parseFloat(messageStr),
        () => messageStr.split("+").map((v) => parseFloat(v.trim())),
      ];

      strategies.forEach((strategy, index) => {
        try {
          const result = strategy();
          console.log(
            `      Plain Strategy ${index + 1}: ${JSON.stringify(result)}`
          );
        } catch (error) {
          console.log(
            `      Plain Strategy ${index + 1}: Failed - ${error.message}`
          );
        }
      });
    }

    // Try parsing as number
    const numValue = parseFloat(messageStr);
    if (!isNaN(numValue)) {
      console.log(`   📊 Parsed as number: ${numValue}`);
    }
  }
  console.log("");
});

client.on("error", (error) => {
  clearTimeout(connectionTimer);
  console.log("❌ Connection error:", error.message);
  client.end();
  process.exit(1);
});

client.on("close", () => {
  console.log("Connection closed");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  client.end();
  process.exit(0);
});
