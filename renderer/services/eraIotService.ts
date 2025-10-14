/**
 * E-Ra IoT Platform Service
 * Integrates with E-Ra IoT Platform using MQTT for real-time sensor data
 *
 * Based on E-Ra MQTT documentation:
 * - MQTT broker connection with GATEWAY_TOKEN authentication
 * - Topic pattern: eoh/chip/GATEWAY_TOKEN/#
 * - Real-time data streaming instead of polling API
 */

import MqttService, {
  MqttConfig,
  MqttSensorData,
  MqttConnectionStatus,
} from "./mqttService";

export interface SensorReading {
  configId: number;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  deviceId: number;
  deviceName: string;
}

export interface EraIotData {
  temperature: number | null;
  humidity: number | null;
  pm25: number | null;
  pm10: number | null;
  lastUpdated: Date;
  status: "success" | "partial" | "error";
  errorMessage?: string;
}

export interface EraIotConfig {
  enabled?: boolean;
  authToken: string; // Will extract GATEWAY_TOKEN from this
  baseUrl: string; // Used to derive MQTT broker URL
  mqttApiKey?: string; // MQTT API key for authentication
  sensorConfigs: {
    temperature: number | null;
    humidity: number | null;
    pm25: number | null;
    pm10: number | null;
  };
  updateInterval: number; // minutes (for compatibility, not used in MQTT)
  timeout: number; // milliseconds (connection timeout)
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

class EraIotService {
  private config: EraIotConfig;
  private mqttService: MqttService | null = null;
  private currentData: EraIotData | null = null;
  private mqttDataUnsubscribe: (() => void) | null = null;
  private mqttStatusUnsubscribe: (() => void) | null = null;
  private dataUpdateCallbacks: ((data: EraIotData) => void)[] = [];
  private statusUpdateCallbacks: ((status: any) => void)[] = [];

  constructor(config: EraIotConfig) {
    this.config = config;
    this.initializeMqttService();
    console.log("EraIotService: Initialized with MQTT config", {
      baseUrl: this.config.baseUrl,
      hasAuthToken: !!this.config.authToken,
      hasMqttApiKey: !!this.config.mqttApiKey,
      sensorConfigs: this.config.sensorConfigs,
    });
  }

  /**
   * Update authentication token dynamically
   * This method is called when user successfully logs in
   */
  public updateAuthToken(newAuthToken: string): void {
    console.log("EraIotService: Updating auth token");

    this.config.authToken = newAuthToken;

    // Reinitialize MQTT service with new token
    this.destroy();
    this.initializeMqttService();

    // Automatically start connection with new token
    this.startPeriodicUpdates().catch((error) => {
      console.error("EraIotService: Failed to start with new token:", error);
    });
  }

  private initializeMqttService(): void {
    try {
      // Extract GATEWAY_TOKEN from authToken
      const gatewayToken = this.extractGatewayToken(this.config.authToken);
      if (!gatewayToken) {
        console.error(
          "EraIotService: Could not extract GATEWAY_TOKEN from authToken"
        );
        return;
      }

      // Derive MQTT broker URL from base URL
      const brokerUrl = this.deriveMqttBrokerUrl(this.config.baseUrl);

      const mqttConfig: MqttConfig = {
        enabled: this.config.enabled,
        brokerUrl,
        gatewayToken,
        mqttApiKey: this.config.mqttApiKey || "default_api_key", // This should be provided by user
        sensorConfigs: this.config.sensorConfigs,
        options: {
          keepalive: 60,
          connectTimeout: this.config.timeout,
          reconnectPeriod: this.config.retryDelay,
          clean: true,
        },
      };

      this.mqttService = new MqttService(mqttConfig);

      // Subscribe to MQTT data updates
      this.mqttDataUnsubscribe = this.mqttService.onDataUpdate((mqttData) => {
        this.handleMqttData(mqttData);
      });

      // Subscribe to MQTT status updates
      this.mqttStatusUnsubscribe = this.mqttService.onStatusUpdate((status) => {
        console.log("EraIotService: MQTT status update:", status);
        this.notifyStatusUpdateCallbacks();
      });
    } catch (error) {
      console.error("EraIotService: Failed to initialize MQTT service:", error);
    }
  }

  /**
   * Extract GATEWAY_TOKEN from authToken
   */
  private extractGatewayToken(authToken: string): string | null {
    // AuthToken format: "Token 78072b06a81e166b8b900d95f4c2ba1234272955"
    const tokenMatch = authToken.match(/Token\s+(.+)/);
    return tokenMatch ? tokenMatch[1] : null;
  }

  /**
   * Derive MQTT broker URL from base URL
   */
  private deriveMqttBrokerUrl(baseUrl: string): string {
    // Convert https://backend.eoh.io to mqtt://backend.eoh.io:1883
    const url = new URL(baseUrl);
    return `mqtt://${url.hostname}:1883`;
  }

  /**
   * Handle MQTT data and convert to EraIotData format
   */
  private handleMqttData(mqttData: MqttSensorData): void {
    this.currentData = {
      temperature: mqttData.temperature,
      humidity: mqttData.humidity,
      pm25: mqttData.pm25,
      pm10: mqttData.pm10,
      lastUpdated: mqttData.timestamp,
      status: this.determineMqttDataStatus(mqttData),
      errorMessage: undefined,
    };

    console.log("EraIotService: Updated data from MQTT:", {
      temperature: this.currentData.temperature,
      humidity: this.currentData.humidity,
      pm25: this.currentData.pm25,
      pm10: this.currentData.pm10,
      status: this.currentData.status,
    });

    // Immediately notify all subscribed components of data updates
    this.notifyDataUpdateCallbacks();
  }

  /**
   * Determine data status based on MQTT data completeness
   */
  private determineMqttDataStatus(
    mqttData: MqttSensorData
  ): EraIotData["status"] {
    const validValues = [
      mqttData.temperature,
      mqttData.humidity,
      mqttData.pm25,
      mqttData.pm10,
    ].filter((value) => value !== null).length;

    if (validValues === 4) return "success";
    if (validValues > 0) return "partial";
    return "error";
  }

  /**
   * Notify all data update callbacks with current data
   */
  private notifyDataUpdateCallbacks(): void {
    if (!this.currentData) return;

    this.dataUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.currentData!);
      } catch (error) {
        console.error("EraIotService: Error in data update callback:", error);
      }
    });
  }

  /**
   * Notify all status update callbacks
   */
  private notifyStatusUpdateCallbacks(): void {
    const status = this.getStatus();
    this.statusUpdateCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error("EraIotService: Error in status update callback:", error);
      }
    });
  }

  /**
   * Start MQTT connection and data streaming
   */
  public async startPeriodicUpdates(): Promise<void> {
    if (!this.mqttService) {
      console.error("EraIotService: MQTT service not initialized");
      return;
    }

    try {
      await this.mqttService.connect();
      console.log(
        "EraIotService: Started MQTT connection for real-time updates"
      );
    } catch (error) {
      console.error("EraIotService: Failed to start MQTT connection:", error);
    }
  }

  /**
   * Stop MQTT connection
   */
  public async stopPeriodicUpdates(): Promise<void> {
    if (this.mqttService) {
      await this.mqttService.disconnect();
      console.log("EraIotService: Stopped MQTT connection");
    }
  }

  /**
   * Get fallback data when MQTT connection fails
   */
  private getFallbackData(): EraIotData {
    return {
      temperature: null,
      humidity: null,
      pm25: 15.0, // Fallback PM2.5 value
      pm10: 25.0, // Fallback PM10 value
      lastUpdated: new Date(),
      status: "error",
      errorMessage: "MQTT connection failed - using fallback data",
    };
  }

  /**
   * Get current sensor data
   */
  public getCurrentData(): EraIotData | null {
    return this.currentData;
  }

  /**
   * Manual refresh of sensor data (forces MQTT reconnection)
   */
  public async refreshData(): Promise<void> {
    console.log("EraIotService: Manual refresh requested - reconnecting MQTT");
    if (this.mqttService) {
      await this.mqttService.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.mqttService.connect();
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<EraIotConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.authToken || newConfig.baseUrl || newConfig.mqttApiKey) {
      // Reinitialize MQTT service with new config
      this.destroy();
      this.initializeMqttService();
    }

    console.log("EraIotService: Configuration updated");
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isRunning: boolean;
    lastUpdate: Date | null;
    retryCount: number;
    currentStatus: EraIotData["status"] | "inactive";
  } {
    const mqttStatus = this.mqttService?.getStatus();
    return {
      isRunning: mqttStatus?.connected || false,
      lastUpdate: this.currentData?.lastUpdated || null,
      retryCount: mqttStatus?.reconnectAttempts || 0,
      currentStatus: this.currentData?.status || "inactive",
    };
  }

  /**
   * Subscribe to real-time data updates (called every second)
   * @param callback Function to call when data is updated
   * @returns Unsubscribe function
   */
  public onDataUpdate(callback: (data: EraIotData) => void): () => void {
    this.dataUpdateCallbacks.push(callback);

    // Immediately call with current data if available
    if (this.currentData) {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error("EraIotService: Error in initial data callback:", error);
      }
    }

    return () => {
      const index = this.dataUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to service status updates
   * @param callback Function to call when status changes
   * @returns Unsubscribe function
   */
  public onStatusUpdate(callback: (status: any) => void): () => void {
    this.statusUpdateCallbacks.push(callback);

    // Immediately call with current status
    try {
      callback(this.getStatus());
    } catch (error) {
      console.error("EraIotService: Error in initial status callback:", error);
    }

    return () => {
      const index = this.statusUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Test MQTT connection
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log("EraIotService: Testing MQTT connection...");

      // Validate AUTHTOKEN format
      if (
        !this.config.authToken ||
        this.config.authToken.includes("1234272955")
      ) {
        return {
          success: false,
          message:
            "Invalid AUTHTOKEN - please use your real AUTHTOKEN from E-Ra platform",
        };
      }

      // Validate MQTT API key
      if (
        !this.config.mqttApiKey ||
        this.config.mqttApiKey === "default_api_key"
      ) {
        return {
          success: false,
          message:
            "MQTT API key is required - please configure mqttApiKey in your config",
        };
      }

      if (!this.mqttService) {
        return {
          success: false,
          message: "MQTT service not initialized",
        };
      }

      // Test MQTT connection
      const result = await this.mqttService.testConnection();
      return result;
    } catch (error: any) {
      console.error("EraIotService: MQTT connection test failed:", error);
      return {
        success: false,
        message: `MQTT connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.mqttDataUnsubscribe) {
      this.mqttDataUnsubscribe();
      this.mqttDataUnsubscribe = null;
    }

    if (this.mqttStatusUnsubscribe) {
      this.mqttStatusUnsubscribe();
      this.mqttStatusUnsubscribe = null;
    }

    if (this.mqttService) {
      this.mqttService.destroy();
      this.mqttService = null;
    }

    // Clear all component callbacks
    this.dataUpdateCallbacks = [];
    this.statusUpdateCallbacks = [];
    this.currentData = null;
    console.log("EraIotService: Destroyed");
  }
}

export default EraIotService;
