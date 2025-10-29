// Test script to simulate reset app command
const mqtt = require("mqtt");

const MQTT_BROKER = "mqtt://mqtt1.eoh.io:1883";
const COMMAND_TOPIC = "its/billboard/commands";
const STATUS_TOPIC = "its/billboard/reset/status";

console.log("🔄 Testing Reset App Command...");

const client = mqtt.connect(MQTT_BROKER, {
  clientId: "reset-test-client-" + Date.now(),
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");

  // Subscribe to status topic to receive reset status updates
  client.subscribe(STATUS_TOPIC, (err) => {
    if (err) {
      console.error("❌ Failed to subscribe to status topic:", err);
      return;
    }
    console.log("📡 Subscribed to reset status topic");

    // Send reset command
    const resetCommand = {
      action: "reset_app",
      timestamp: Date.now(),
      source: "test_script",
      reason: "Testing reset functionality",
    };

    console.log("📤 Sending reset command:", resetCommand);

    client.publish(
      COMMAND_TOPIC,
      JSON.stringify(resetCommand),
      { qos: 1 },
      (err) => {
        if (err) {
          console.error("❌ Failed to publish reset command:", err);
          client.end();
          return;
        }
        console.log("✅ Reset command sent successfully");
      }
    );
  });
});

client.on("message", (topic, message) => {
  console.log(`📨 Received message on ${topic}:`, message.toString());

  try {
    const status = JSON.parse(message.toString());
    console.log("🔍 Parsed status:", status);

    if (status.status === "reset_started") {
      console.log("🚀 Reset process started...");
    } else if (status.status === "restarting") {
      console.log("🔄 App is restarting...");
      // Wait a bit then disconnect
      setTimeout(() => {
        console.log("✅ Test completed - app should be restarting");
        client.end();
        process.exit(0);
      }, 2000);
    } else if (status.status === "error") {
      console.error("❌ Reset failed:", status.error);
      client.end();
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to parse status message:", error);
  }
});

client.on("error", (error) => {
  console.error("❌ MQTT connection error:", error);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error("⏰ Test timeout - no response received");
  client.end();
  process.exit(1);
}, 30000);
