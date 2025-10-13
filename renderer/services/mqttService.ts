/**
 * E-Ra IoT MQTT Service
 * Replaces REST API with MQTT.js integration for real-time data
 *
 * Based on E-Ra IoT MQTT documentation:
 * - Broker: mqtt://backend.eoh.io (assumed from API base URL)
 * - Topic pattern: eoh/chip/GATEWAY_TOKEN/#
 * - Authentication: username = GATEWAY_TOKEN, password = MQTT_API_KEY
 */

import * as mqtt from "mqtt";

export interface MqttSensorData {
  temperature: number | null;
  humidity: number | null;
  pm25: number | null;
  pm10: number | null;
  timestamp: Date;
}

export interface MqttConfig {
  enabled?: boolean;
  brokerUrl: string;
  gatewayToken: string;
  mqttApiKey: string;
  authToken?: string; // Full auth token with "Token " prefix
  sensorConfigs: {
    temperature: number;
    humidity: number;
    pm25: number;
    pm10: number;
  };
  options: {
    keepalive: number;
    connectTimeout: number;
    reconnectPeriod: number;
    clean: boolean;
  };
}

export interface MqttConnectionStatus {
  connected: boolean;
  lastConnected: Date | null;
  lastMessage: Date | null;
  reconnectAttempts: number;
  error?: string;
}

class MqttService {
  private client: mqtt.MqttClient | null = null;
  private config: MqttConfig;
  private currentData: MqttSensorData;
  private status: MqttConnectionStatus;
  private dataCallbacks: ((data: MqttSensorData) => void)[] = [];
  private statusCallbacks: ((status: MqttConnectionStatus) => void)[] = [];
  private periodicUpdateInterval: NodeJS.Timeout | null = null;

  constructor(config: MqttConfig) {
    this.config = config;
    this.currentData = {
      temperature: null,
      humidity: null,
      pm25: null,
      pm10: null,
      timestamp: new Date(),
    };
    this.status = {
      connected: false,
      lastConnected: null,
      lastMessage: null,
      reconnectAttempts: 0,
    };

    // Extract gateway token from authToken if available
    this.updateGatewayTokenFromAuth();

    console.log("MqttService: Initialized with config", {
      brokerUrl: this.config.brokerUrl,
      gatewayToken: this.config.gatewayToken.substring(0, 10) + "...",
      hasApiKey: !!this.config.mqttApiKey,
      hasAuthToken: !!this.config.authToken,
      sensorConfigs: this.config.sensorConfigs,
    });
  }

  /**
   * Extract gateway token from authToken if available
   */
  private updateGatewayTokenFromAuth(): void {
    if (this.config.authToken && this.config.authToken.startsWith("Token ")) {
      this.config.gatewayToken = this.config.authToken.substring(6);
      console.log("MqttService: Updated gateway token from auth token");
    }
  }

  /**
   * Connect to MQTT broker
   */
  public async connect(): Promise<void> {
    if (this.client) {
      console.warn("MqttService: Already connected or connecting");
      return;
    }

    try {
      const clientOptions: mqtt.IClientOptions = {
        username: this.config.gatewayToken,
        password: this.config.mqttApiKey,
        keepalive: this.config.options.keepalive,
        connectTimeout: this.config.options.connectTimeout,
        reconnectPeriod: this.config.options.reconnectPeriod,
        clean: this.config.options.clean,
        clientId: `billboard_${this.config.gatewayToken}_${Date.now()}`,
      };

      console.log("MqttService: Connecting to broker...", {
        url: this.config.brokerUrl,
        username: this.config.gatewayToken.substring(0, 10) + "...",
        clientId: clientOptions.clientId,
      });

      this.client = mqtt.connect(this.config.brokerUrl, clientOptions);

      this.client.on("connect", () => {
        console.log("MqttService: Connected to MQTT broker");
        this.status.connected = true;
        this.status.lastConnected = new Date();
        this.status.reconnectAttempts = 0;
        this.status.error = undefined;
        this.notifyStatusCallbacks();
        this.subscribeToTopics();
        this.startPeriodicUpdates();
      });

      this.client.on("message", (topic: string, message: Buffer) => {
        this.handleMessage(topic, message);
      });

      this.client.on("error", (error) => {
        console.error("MqttService: Connection error:", error);
        this.status.error = error.message;
        this.notifyStatusCallbacks();
      });

      this.client.on("disconnect", () => {
        console.log("MqttService: Disconnected from MQTT broker");
        this.status.connected = false;
        this.notifyStatusCallbacks();
      });

      this.client.on("reconnect", () => {
        this.status.reconnectAttempts++;
        console.log(
          `MqttService: Reconnecting... (attempt ${this.status.reconnectAttempts})`
        );
        this.notifyStatusCallbacks();
      });

      this.client.on("close", () => {
        console.log("MqttService: Connection closed");
        this.status.connected = false;
        this.stopPeriodicUpdates();
        this.notifyStatusCallbacks();
      });
    } catch (error) {
      console.error("MqttService: Failed to connect:", error);
      this.status.error =
        error instanceof Error ? error.message : "Unknown connection error";
      this.notifyStatusCallbacks();
      throw error;
    }
  }

  /**
   * Start periodic updates every second to ensure components always receive fresh data
   */
  private startPeriodicUpdates(): void {
    if (this.periodicUpdateInterval) {
      clearInterval(this.periodicUpdateInterval);
    }

    // Emit data updates every 1000ms (1 second) to ensure real-time responsiveness
    this.periodicUpdateInterval = setInterval(() => {
      if (this.status.connected) {
        // Update timestamp to show the data is being actively monitored
        this.currentData.timestamp = new Date();
        this.notifyDataCallbacks();
        console.log(
          "MqttService: Periodic update triggered - data pushed to components"
        );
      }
    }, 1000);

    console.log("MqttService: Started periodic updates every 1 second");
  }

  /**
   * Stop periodic updates
   */
  private stopPeriodicUpdates(): void {
    if (this.periodicUpdateInterval) {
      clearInterval(this.periodicUpdateInterval);
      this.periodicUpdateInterval = null;
      console.log("MqttService: Stopped periodic updates");
    }
  }

  /**
   * Subscribe to sensor data topics
   */
  private subscribeToTopics(): void {
    if (!this.client || !this.status.connected) {
      console.warn("MqttService: Cannot subscribe - client not connected");
      return;
    }

    // Main topic pattern for all sensor data
    const mainTopic = `eoh/chip/${this.config.gatewayToken}/#`;

    // Subscribe to individual sensor topics if they follow a pattern
    const sensorTopics = [
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.temperature}`,
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.humidity}`,
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.pm25}`,
      `eoh/chip/${this.config.gatewayToken}/sensor/${this.config.sensorConfigs.pm10}`,
      // Alternative topic patterns
      `eoh/chip/${this.config.gatewayToken}/data/temperature`,
      `eoh/chip/${this.config.gatewayToken}/data/humidity`,
      `eoh/chip/${this.config.gatewayToken}/data/pm25`,
      `eoh/chip/${this.config.gatewayToken}/data/pm10`,
      // Wildcard subscription
      mainTopic,
    ];

    sensorTopics.forEach((topic) => {
      this.client!.subscribe(topic, (err) => {
        if (err) {
          console.error(`MqttService: Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`MqttService: Subscribed to ${topic}`);
        }
      });
    });
  }

  /**
   * Handle incoming MQTT messages
   */
  private handleMessage(topic: string, message: Buffer): void {
    try {
      const messageStr = message.toString();
      console.log(`MqttService: Received message on ${topic}: ${messageStr}`);

      this.status.lastMessage = new Date();

      // Parse message - could be JSON or plain value
      let data: any;
      try {
        data = JSON.parse(messageStr);
      } catch {
        // If not JSON, treat as plain number
        data = parseFloat(messageStr);
      }

      // Map topic to sensor type and update data
      this.updateSensorData(topic, data);

      // Notify data callbacks
      this.notifyDataCallbacks();
      this.notifyStatusCallbacks();
    } catch (error) {
      console.error("MqttService: Error processing message:", error);
    }
  }

  /**
   * Update sensor data based on topic and value
   */
  private updateSensorData(topic: string, data: any): void {
    let value: number | null = null;

    // Extract numeric value from different data formats
    if (typeof data === "number" && !isNaN(data)) {
      value = data;
    } else if (typeof data === "object" && data !== null) {
      // Try different possible field names
      value =
        data.current_value_only ??
        data.current_value ??
        data.value ??
        data.data ??
        null;
    }

    if (value === null || isNaN(value)) {
      console.warn(
        `MqttService: Could not extract numeric value from topic ${topic}:`,
        data
      );
      return;
    }

    // Map topic to sensor type
    const sensorType = this.mapTopicToSensorType(topic);
    if (sensorType) {
      console.log(`MqttService: Updating ${sensorType} = ${value}`);
      this.currentData[sensorType] = value;
      this.currentData.timestamp = new Date();
    }
  }

  /**
   * Map MQTT topic to sensor type
   */
  private mapTopicToSensorType(
    topic: string
  ): keyof Omit<MqttSensorData, "timestamp"> | null {
    // Check for sensor config IDs in topic
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
      topic.includes("pm25") ||
      topic.includes("pm2.5")
    ) {
      return "pm25";
    }
    if (
      topic.includes(this.config.sensorConfigs.pm10.toString()) ||
      topic.includes("pm10")
    ) {
      return "pm10";
    }

    console.warn(`MqttService: Could not map topic to sensor type: ${topic}`);
    return null;
  }

  /**
   * Disconnect from MQTT broker
   */
  public async disconnect(): Promise<void> {
    this.stopPeriodicUpdates();
    if (this.client) {
      console.log("MqttService: Disconnecting from MQTT broker");
      await new Promise<void>((resolve) => {
        this.client!.end(false, {}, () => {
          this.client = null;
          this.status.connected = false;
          this.notifyStatusCallbacks();
          resolve();
        });
      });
    }
  }

  /**
   * Get current sensor data
   */
  public getCurrentData(): MqttSensorData {
    return { ...this.currentData };
  }

  /**
   * Get connection status
   */
  public getStatus(): MqttConnectionStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to data updates
   */
  public onDataUpdate(callback: (data: MqttSensorData) => void): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to status updates
   */
  public onStatusUpdate(
    callback: (status: MqttConnectionStatus) => void
  ): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MqttConfig>): void {
    const wasConnected = this.status.connected;

    // Disconnect if connection parameters changed
    if (
      wasConnected &&
      (newConfig.brokerUrl !== undefined ||
        newConfig.gatewayToken !== undefined ||
        newConfig.authToken !== undefined ||
        newConfig.mqttApiKey !== undefined)
    ) {
      this.disconnect();
    }

    this.config = { ...this.config, ...newConfig };

    // Update gateway token if auth token changed
    this.updateGatewayTokenFromAuth();

    console.log("MqttService: Configuration updated");

    // Reconnect if it was connected before
    if (wasConnected) {
      setTimeout(() => this.connect(), 1000);
    }
  }

  /**
   * Test MQTT connection
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log("MqttService: Testing MQTT connection...");

      // Validate configuration
      if (!this.config.gatewayToken) {
        return {
          success: false,
          message: "Gateway token is required",
        };
      }

      if (!this.config.mqttApiKey) {
        return {
          success: false,
          message: "MQTT API key is required",
        };
      }

      // Try to connect
      await this.connect();

      // Wait a bit for connection to stabilize
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (this.status.connected) {
        return {
          success: true,
          message: "MQTT connection successful",
        };
      } else {
        return {
          success: false,
          message: this.status.error || "Connection failed for unknown reason",
        };
      }
    } catch (error) {
      console.error("MqttService: Connection test failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Notify data callbacks
   */
  private notifyDataCallbacks(): void {
    this.dataCallbacks.forEach((callback) => {
      try {
        callback(this.getCurrentData());
      } catch (error) {
        console.error("MqttService: Error in data callback:", error);
      }
    });
  }

  /**
   * Notify status callbacks
   */
  private notifyStatusCallbacks(): void {
    this.statusCallbacks.forEach((callback) => {
      try {
        callback(this.getStatus());
      } catch (error) {
        console.error("MqttService: Error in status callback:", error);
      }
    });
  }

  /**
   * Destroy service and cleanup resources
   */
  public destroy(): void {
    this.stopPeriodicUpdates();
    this.disconnect();
    this.dataCallbacks = [];
    this.statusCallbacks = [];
    console.log("MqttService: Destroyed");
  }
}

export default MqttService;
