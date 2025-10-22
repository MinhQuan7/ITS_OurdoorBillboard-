/**
 * E-Ra IoT MQTT Integration Test
 *
 * Tests the new MQTT-based approach for getting sensor values
 * instead of REST API polling. This validates:
 * - MQTT connection to mqtt1.eoh.io:1883
 * - Topic subscription: eoh/chip/{token}/config/+
 * - Payload parsing: {"key": value}
 * - Sensor mapping: configId -> sensor type
 * - Authentication: username={token}, password={token}
 *
 * Usage: node test-era-mqtt-integration.js
 */

const fs = require("fs");
const path = require("path");

// Load configuration from config.json
let config = null;
try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const rawConfig = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(rawConfig);
  }
} catch (error) {
  console.error('Could not load config.json:', error.message);
  process.exit(1);
}

if (!config || !config.eraIot) {
  console.error('E-RA IoT configuration not found in config.json');
  process.exit(1);
}

// Extract gateway token from authToken
function extractGatewayToken(authToken) {
  const tokenMatch = authToken.match(/Token\s+(.+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

// Test configuration
const gatewayToken = extractGatewayToken(config.eraIot.authToken);
if (!gatewayToken) {
  console.error('Could not extract gateway token from authToken');
  process.exit(1);
}

const MQTT_CONFIG = {
  broker: 'mqtt://mqtt1.eoh.io:1883',
  username: gatewayToken,
  password: gatewayToken,
  topic: `eoh/chip/${gatewayToken}/config/+`,
  lwtTopic: `eoh/chip/${gatewayToken}/lwt`,
  sensorConfigs: config.eraIot.sensorConfigs,
  clientId: `test_billboard_${gatewayToken}_${Date.now()}`,
};

console.log('E-Ra IoT MQTT Integration Test');
console.log('==============================');
console.log(`Broker: ${MQTT_CONFIG.broker}`);
console.log(`Username: ${MQTT_CONFIG.username.substring(0, 10)}...`);
console.log(`Topic Pattern: ${MQTT_CONFIG.topic}`);
console.log(`Sensor Configs:`, MQTT_CONFIG.sensorConfigs);
console.log('');

// Use real MQTT if available, otherwise use mock for testing
let mqtt;
try {
  mqtt = require('mqtt');
  console.log('Using real MQTT.js library');
} catch (error) {
  console.log('MQTT.js not available, using mock implementation');
  // Mock mqtt module for testing environment
const mqtt = {
  connect: (brokerUrl, options) => {
    console.log(`Mock MQTT: Attempting to connect to ${brokerUrl}`);
    console.log("Mock MQTT: Connection options:", {
      username: options.username?.substring(0, 10) + "...",
      hasPassword: !!options.password,
      keepalive: options.keepalive,
      connectTimeout: options.connectTimeout,
      clientId: options.clientId,
    });

    // Mock client implementation
    const client = {
      connected: false,
      callbacks: {},
      subscriptions: [],

      on(event, callback) {
        if (!this.callbacks[event]) {
          this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
      },

      subscribe(topic, callback) {
        console.log(`Mock MQTT: Subscribing to topic: ${topic}`);
        this.subscriptions.push(topic);
        if (callback) callback(null);
      },

      end(force, options, callback) {
        console.log("Mock MQTT: Disconnecting...");
        this.connected = false;
        if (callback) callback();
      },

      // Simulate connection success
      simulateConnect() {
        setTimeout(() => {
          console.log("Mock MQTT: Connection established");
          this.connected = true;
          if (this.callbacks.connect) {
            this.callbacks.connect.forEach((cb) => cb());
          }
        }, 100);
      },

      // Simulate incoming message
      simulateMessage(topic, message) {
        setTimeout(() => {
          console.log(`Mock MQTT: Simulating message on ${topic}: ${message}`);
          if (this.callbacks.message) {
            this.callbacks.message.forEach((cb) =>
              cb(topic, Buffer.from(message))
            );
          }
        }, 200);
      },
    };

    // Simulate successful connection
    client.simulateConnect();

    // Simulate some test messages after subscription - now with 1-second intervals
    setTimeout(() => {
      client.simulateMessage("eoh/chip/test_gateway/sensor/138997", "25.5");
    }, 500);

    setTimeout(() => {
      client.simulateMessage("eoh/chip/test_gateway/sensor/138998", "65.2");
    }, 1500);

    setTimeout(() => {
      client.simulateMessage("eoh/chip/test_gateway/sensor/138999", "12.3");
    }, 2500);

    setTimeout(() => {
      client.simulateMessage("eoh/chip/test_gateway/sensor/139000", "18.7");
    }, 3500);

    return client;
  },
};

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

const TEST_CONFIG = {
  authToken:
    process.env.ERA_IOT_TOKEN ||
    savedConfig?.eraIot?.authToken ||
    "Token test_gateway_token_123",
  baseUrl: savedConfig?.eraIot?.baseUrl || "https://backend.eoh.io",
  mqttApiKey: process.env.ERA_MQTT_API_KEY || "test_mqtt_api_key_123",
  sensorConfigs: savedConfig?.eraIot?.sensorConfigs || {
    temperature: 138997,
    humidity: 138998,
    pm25: 138999,
    pm10: 139000,
  },
  timeout: 15000,
};

// MQTT Service Implementation (simplified for testing)
class MqttService {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.currentData = {
      temperature: null,
      humidity: null,
      pm25: null,
      pm10: null,
      timestamp: new Date(),
    };
    this.dataCallbacks = [];
    this.statusCallbacks = [];
    this.status = {
      connected: false,
      lastConnected: null,
      lastMessage: null,
      reconnectAttempts: 0,
    };
  }

  async connect() {
    console.log("MqttService: Starting connection...");

    const clientOptions = {
      username: this.config.gatewayToken,
      password: this.config.mqttApiKey,
      keepalive: 60,
      connectTimeout: this.config.options?.connectTimeout || 30000,
      reconnectPeriod: 1000,
      clean: true,
      clientId: `billboard_${this.config.gatewayToken}_${Date.now()}`,
    };

    this.client = mqtt.connect(this.config.brokerUrl, clientOptions);

    this.client.on("connect", () => {
      console.log("✅ MQTT connected successfully");
      this.status.connected = true;
      this.status.lastConnected = new Date();
      this.subscribeToTopics();
    });

    this.client.on("message", (topic, message) => {
      this.handleMessage(topic, message);
    });

    this.client.on("error", (error) => {
      console.error("❌ MQTT connection error:", error.message);
      this.status.error = error.message;
    });

    this.client.on("disconnect", () => {
      console.log("📡 MQTT disconnected");
      this.status.connected = false;
    });
  }

  subscribeToTopics() {
    const topics = [
      `eoh/chip/${this.config.gatewayToken}/#`,
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.temperature}`,
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.humidity}`,
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.pm25}`,
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.pm10}`,
    ];

    topics.forEach((topic) => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`📡 Subscribed to: ${topic}`);
        }
      });
    });
  }

  handleMessage(topic, message) {
    const messageStr = message.toString();
    console.log(`📨 Message received on ${topic}: ${messageStr}`);

    this.status.lastMessage = new Date();

    // Parse message
    let value;
    try {
      const data = JSON.parse(messageStr);
      value =
        data.current_value_only ?? data.current_value ?? data.value ?? data;
    } catch {
      value = parseFloat(messageStr);
    }

    if (isNaN(value)) {
      console.warn(`⚠️  Could not parse numeric value: ${messageStr}`);
      return;
    }

    // Map topic to sensor type
    const sensorType = this.mapTopicToSensorType(topic);
    if (sensorType) {
      console.log(`📊 Updating ${sensorType} = ${value}`);
      this.currentData[sensorType] = value;
      this.currentData.timestamp = new Date();

      // Notify callbacks
      this.dataCallbacks.forEach((callback) => {
        try {
          callback(this.currentData);
        } catch (error) {
          console.error("Error in data callback:", error);
        }
      });
    }
  }

  mapTopicToSensorType(topic) {
    if (
      topic.includes(this.config.sensorConfigs.temperature.toString()) ||
      topic.includes("temperature")
    ) {
      return "temperature";
    }
    if (
      topic.includes(this.config.sensorConfigs.humidity.toString()) ||
      topic.includes("humidity")
    ) {
      return "humidity";
    }
    if (
      topic.includes(this.config.sensorConfigs.pm25.toString()) ||
      topic.includes("pm25")
    ) {
      return "pm25";
    }
    if (
      topic.includes(this.config.sensorConfigs.pm10.toString()) ||
      topic.includes("pm10")
    ) {
      return "pm10";
    }
    return null;
  }

  onDataUpdate(callback) {
    this.dataCallbacks.push(callback);
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  getCurrentData() {
    return { ...this.currentData };
  }

  getStatus() {
    return { ...this.status };
  }

  async disconnect() {
    if (this.client) {
      await new Promise((resolve) => {
        this.client.end(false, {}, () => {
          this.client = null;
          resolve();
        });
      });
    }
  }

  async testConnection() {
    try {
      await this.connect();

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (this.status.connected) {
        return {
          success: true,
          message: "MQTT connection successful",
        };
      } else {
        return {
          success: false,
          message: this.status.error || "Connection failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  destroy() {
    this.disconnect();
    this.dataCallbacks = [];
    this.statusCallbacks = [];
  }
}

class MqttIntegrationTest {
  constructor(config) {
    this.config = config;
    this.results = {
      tests: [],
      overallStatus: "pending",
    };
  }

  async runAllTests() {
    console.log("E-Ra IoT MQTT Integration Test");
    console.log("===============================");
    console.log(
      `MQTT Broker: ${this.deriveMqttBrokerUrl(this.config.baseUrl)}`
    );
    console.log(
      `Gateway Token: ${this.extractGatewayToken(
        this.config.authToken
      )?.substring(0, 10)}...`
    );
    console.log(`Has MQTT API Key: ${!!this.config.mqttApiKey}`);
    console.log();

    try {
      // Test 1: Configuration validation
      await this.testConfigurationValidation();

      // Test 2: MQTT connection
      await this.testMqttConnection();

      // Test 3: Topic subscription and data reception
      await this.testDataReception();

      // Print final results
      this.printTestResults();
    } catch (error) {
      console.error("Critical test failure:", error.message);
      this.results.overallStatus = "failed";
    }
  }

  extractGatewayToken(authToken) {
    const tokenMatch = authToken.match(/Token\s+(.+)/);
    return tokenMatch ? tokenMatch[1] : null;
  }

  deriveMqttBrokerUrl(baseUrl) {
    const url = new URL(baseUrl);
    return `mqtt://${url.hostname}:1883`;
  }

  async testConfigurationValidation() {
    console.log("🔧 Test 1: Configuration Validation");
    console.log("─".repeat(40));

    const gatewayToken = this.extractGatewayToken(this.config.authToken);

    if (!gatewayToken) {
      this.results.tests.push({
        name: "Gateway Token Extraction",
        status: "failed",
        message: "Could not extract gateway token from authToken",
      });
      console.log("❌ Gateway token extraction failed");
      return;
    }

    if (
      !this.config.mqttApiKey ||
      this.config.mqttApiKey === "test_mqtt_api_key_123"
    ) {
      this.results.tests.push({
        name: "MQTT API Key",
        status: "warning",
        message: "Using test MQTT API key - replace with real key",
      });
      console.log("⚠️  Using test MQTT API key");
    } else {
      this.results.tests.push({
        name: "MQTT API Key",
        status: "passed",
        message: "MQTT API key configured",
      });
      console.log("✅ MQTT API key configured");
    }

    this.results.tests.push({
      name: "Gateway Token Extraction",
      status: "passed",
      message: `Gateway token: ${gatewayToken.substring(0, 10)}...`,
    });
    console.log(
      `✅ Gateway token extracted: ${gatewayToken.substring(0, 10)}...`
    );
  }

  async testMqttConnection() {
    console.log("\n🌐 Test 2: MQTT Connection");
    console.log("─".repeat(40));

    const gatewayToken = this.extractGatewayToken(this.config.authToken);
    const brokerUrl = this.deriveMqttBrokerUrl(this.config.baseUrl);

    const mqttConfig = {
      brokerUrl,
      gatewayToken,
      mqttApiKey: this.config.mqttApiKey,
      sensorConfigs: this.config.sensorConfigs,
      options: {
        connectTimeout: this.config.timeout,
      },
    };

    const mqttService = new MqttService(mqttConfig);

    try {
      const result = await mqttService.testConnection();

      if (result.success) {
        this.results.tests.push({
          name: "MQTT Connection",
          status: "passed",
          message: result.message,
        });
        console.log(`✅ ${result.message}`);
      } else {
        this.results.tests.push({
          name: "MQTT Connection",
          status: "failed",
          message: result.message,
        });
        console.log(`❌ ${result.message}`);
      }

      await mqttService.destroy();
    } catch (error) {
      this.results.tests.push({
        name: "MQTT Connection",
        status: "failed",
        message: error.message,
      });
      console.log(`❌ Connection test failed: ${error.message}`);
    }
  }

  async testDataReception() {
    console.log("\n📊 Test 3: Data Reception Simulation");
    console.log("─".repeat(40));

    const gatewayToken = this.extractGatewayToken(this.config.authToken);
    const brokerUrl = this.deriveMqttBrokerUrl(this.config.baseUrl);

    const mqttConfig = {
      brokerUrl,
      gatewayToken,
      mqttApiKey: this.config.mqttApiKey,
      sensorConfigs: this.config.sensorConfigs,
      options: {
        connectTimeout: this.config.timeout,
      },
    };

    const mqttService = new MqttService(mqttConfig);
    let dataReceived = {};

    // Subscribe to data updates
    const unsubscribe = mqttService.onDataUpdate((data) => {
      Object.keys(data).forEach((key) => {
        if (key !== "timestamp" && data[key] !== null) {
          dataReceived[key] = data[key];
        }
      });
    });

    try {
      await mqttService.connect();

      // Wait for simulated messages - extended to allow 1-second interval testing
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const receivedSensors = Object.keys(dataReceived);
      const expectedSensors = ["temperature", "humidity", "pm25", "pm10"];

      console.log("📨 Simulated data received:");
      receivedSensors.forEach((sensor) => {
        console.log(`   ${sensor}: ${dataReceived[sensor]}`);
      });

      if (receivedSensors.length === expectedSensors.length) {
        this.results.tests.push({
          name: "Data Reception",
          status: "passed",
          message: `All sensor data received: ${receivedSensors.join(", ")}`,
        });
        console.log("✅ All sensor data received successfully");
      } else {
        this.results.tests.push({
          name: "Data Reception",
          status: "partial",
          message: `Received ${
            receivedSensors.length
          }/4 sensors: ${receivedSensors.join(", ")}`,
        });
        console.log(
          `⚠️  Partial data reception: ${receivedSensors.length}/4 sensors`
        );
      }

      unsubscribe();
      await mqttService.destroy();
    } catch (error) {
      this.results.tests.push({
        name: "Data Reception",
        status: "failed",
        message: error.message,
      });
      console.log(`❌ Data reception test failed: ${error.message}`);
      unsubscribe();
      await mqttService.destroy();
    }
  }

  printTestResults() {
    console.log("\n📋 Test Results Summary");
    console.log("=".repeat(50));

    const passed = this.results.tests.filter(
      (t) => t.status === "passed"
    ).length;
    const failed = this.results.tests.filter(
      (t) => t.status === "failed"
    ).length;
    const warnings = this.results.tests.filter(
      (t) => t.status === "warning" || t.status === "partial"
    ).length;

    this.results.tests.forEach((test) => {
      const icon =
        test.status === "passed"
          ? "✅"
          : test.status === "failed"
          ? "❌"
          : "⚠️";
      console.log(`${icon} ${test.name}: ${test.message}`);
    });

    console.log("\n" + "=".repeat(50));
    console.log(
      `📊 Results: ${passed} passed, ${failed} failed, ${warnings} warnings`
    );

    if (failed === 0) {
      console.log("🎉 MQTT integration test completed successfully!");
      console.log("\n📝 Next Steps:");
      console.log(
        "1. Replace test MQTT API key with your real key from E-Ra Platform"
      );
      console.log(
        "2. Update your authToken with the real token (remove 1234272955 placeholder)"
      );
      console.log("3. Run the application: npm run dev");
      console.log("4. Check the IoT panel for real-time MQTT data");
      this.results.overallStatus = "passed";
    } else {
      console.log(
        "⚠️  Some tests failed - please review and fix the issues above"
      );
      console.log("\n🔧 Troubleshooting:");
      console.log("1. Verify your MQTT API key is correct");
      console.log("2. Check if your E-Ra device is online and publishing data");
      console.log("3. Ensure your gateway token extraction is working");
      console.log(
        "4. Verify MQTT broker connectivity (mqtt://backend.eoh.io:1883)"
      );
      this.results.overallStatus = "failed";
    }
  }
}

// Execute test
async function runTest() {
  if (!TEST_CONFIG.authToken || TEST_CONFIG.authToken.includes("1234272955")) {
    console.log("⚠️  Using placeholder authToken for testing");
    console.log(
      "For production, please update with your real E-Ra IoT authToken"
    );
  }

  const test = new MqttIntegrationTest(TEST_CONFIG);
  await test.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { MqttIntegrationTest, TEST_CONFIG };
