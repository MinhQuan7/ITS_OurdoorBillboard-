/**
 * Banner Management Service for E-Ra IoT Platform
 * Handles real-time banner updates via MQTT and E-Ra API
 */

import MqttService, { MqttConfig } from "./mqttService";

export interface BannerData {
  imageData: string | null; // Base64 encoded image
  filename: string | null;
  timestamp: Date;
  fileSize?: number;
  status: "active" | "updating" | "error" | "none";
}

export interface BannerConfig {
  enabled?: boolean;
  authToken: string; // E-Ra auth token
  baseUrl: string; // E-Ra API base URL
  mqttApiKey?: string; // MQTT API key
  variables: {
    bannerData: string; // Variable name for banner data
    bannerFilename: string; // Variable name for filename
    bannerTimestamp: string; // Variable name for timestamp
    bannerStatus: string; // Variable name for status
  };
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

class BannerService {
  private config: BannerConfig;
  private mqttService: MqttService | null = null;
  private currentBanner: BannerData | null = null;
  private mqttDataUnsubscribe: (() => void) | null = null;
  private mqttStatusUnsubscribe: (() => void) | null = null;
  private bannerUpdateCallbacks: ((data: BannerData) => void)[] = [];
  private statusUpdateCallbacks: ((status: any) => void)[] = [];

  constructor(config: BannerConfig) {
    this.config = config;
    this.initializeMqttService();
    console.log("BannerService: Initialized with config", {
      baseUrl: this.config.baseUrl,
      hasAuthToken: !!this.config.authToken,
      variables: this.config.variables,
    });
  }

  /**
   * Update authentication token dynamically
   */
  public updateAuthToken(newAuthToken: string): void {
    console.log("BannerService: Updating auth token");
    this.config.authToken = newAuthToken;

    // Reinitialize services with new token
    this.destroy();
    this.initializeMqttService();

    // Auto-start monitoring
    this.startBannerMonitoring().catch((error) => {
      console.error(
        "BannerService: Failed to start monitoring with new token:",
        error
      );
    });
  }

  /**
   * Initialize MQTT service for real-time banner updates
   */
  private initializeMqttService(): void {
    try {
      const gatewayToken = this.extractGatewayToken(this.config.authToken);
      if (!gatewayToken) {
        console.error(
          "BannerService: Could not extract GATEWAY_TOKEN from authToken"
        );
        return;
      }

      const brokerUrl = this.deriveMqttBrokerUrl(this.config.baseUrl);

      const mqttConfig: MqttConfig = {
        enabled: this.config.enabled,
        brokerUrl,
        gatewayToken,
        mqttApiKey: this.config.mqttApiKey || "default_api_key",
        // Use banner variables instead of sensor configs
        sensorConfigs: {
          temperature: null,
          humidity: null,
          pm25: null,
          pm10: null,
        },
        options: {
          keepalive: 60,
          connectTimeout: this.config.timeout,
          reconnectPeriod: this.config.retryDelay,
          clean: true,
        },
      };

      this.mqttService = new MqttService(mqttConfig);

      // Subscribe to MQTT data updates for banner variables
      this.mqttDataUnsubscribe = this.mqttService.onDataUpdate((mqttData) => {
        // We'll handle banner-specific data differently
        this.handleBannerMqttData(mqttData);
      });

      // Subscribe to MQTT status updates
      this.mqttStatusUnsubscribe = this.mqttService.onStatusUpdate((status) => {
        console.log("BannerService: MQTT status update:", status);
        this.notifyStatusUpdateCallbacks();
      });

      // Subscribe to custom banner variables
      this.subscribeToBannerVariables();
    } catch (error) {
      console.error("BannerService: Failed to initialize MQTT service:", error);
    }
  }

  /**
   * Subscribe to banner-specific MQTT topics
   */
  private subscribeToBannerVariables(): void {
    if (!this.mqttService) return;

    const gatewayToken = this.extractGatewayToken(this.config.authToken);
    if (!gatewayToken) return;

    // Subscribe to banner data topics
    const topics = [
      `eoh/chip/${gatewayToken}/${this.config.variables.bannerData}`,
      `eoh/chip/${gatewayToken}/${this.config.variables.bannerFilename}`,
      `eoh/chip/${gatewayToken}/${this.config.variables.bannerTimestamp}`,
      `eoh/chip/${gatewayToken}/${this.config.variables.bannerStatus}`,
    ];

    topics.forEach((topic) => {
      console.log(`BannerService: Subscribing to topic: ${topic}`);
      // We'll extend MQTT service to handle custom subscriptions
    });
  }

  /**
   * Handle banner-specific MQTT data
   */
  private handleBannerMqttData(mqttData: any): void {
    // This will be called when banner variables are updated via MQTT
    console.log("BannerService: Received MQTT data:", mqttData);

    // For now, we'll poll the API when we detect changes
    this.fetchCurrentBanner().catch((error) => {
      console.error(
        "BannerService: Failed to fetch banner after MQTT update:",
        error
      );
    });
  }

  /**
   * Extract GATEWAY_TOKEN from authToken
   */
  private extractGatewayToken(authToken: string): string | null {
    const tokenMatch = authToken.match(/Token\s+(.+)/);
    return tokenMatch ? tokenMatch[1] : null;
  }

  /**
   * Derive MQTT broker URL from base URL
   */
  private deriveMqttBrokerUrl(baseUrl: string): string {
    const url = new URL(baseUrl);
    return `mqtt://${url.hostname}:1883`;
  }

  /**
   * Start banner monitoring via MQTT
   */
  public async startBannerMonitoring(): Promise<void> {
    if (!this.mqttService) {
      console.error("BannerService: MQTT service not initialized");
      return;
    }

    try {
      await this.mqttService.connect();
      console.log(
        "BannerService: Started MQTT connection for banner monitoring"
      );

      // Fetch current banner on startup
      await this.fetchCurrentBanner();
    } catch (error) {
      console.error("BannerService: Failed to start banner monitoring:", error);
    }
  }

  /**
   * Stop banner monitoring
   */
  public async stopBannerMonitoring(): Promise<void> {
    if (this.mqttService) {
      await this.mqttService.disconnect();
      console.log("BannerService: Stopped banner monitoring");
    }
  }

  /**
   * Fetch current banner from E-Ra API
   */
  public async fetchCurrentBanner(): Promise<void> {
    try {
      const bannerData = await this.getVariableValue(
        this.config.variables.bannerData
      );
      const filename = await this.getVariableValue(
        this.config.variables.bannerFilename
      );
      const timestamp = await this.getVariableValue(
        this.config.variables.bannerTimestamp
      );
      const status = await this.getVariableValue(
        this.config.variables.bannerStatus
      );

      const bannerInfo: BannerData = {
        imageData: bannerData || null,
        filename: filename || null,
        timestamp: timestamp ? new Date(parseInt(timestamp)) : new Date(),
        status: this.mapBannerStatus(status),
      };

      // Only update if data has changed
      if (this.hasBannerChanged(bannerInfo)) {
        this.currentBanner = bannerInfo;
        console.log("BannerService: Updated banner data:", {
          hasImage: !!bannerInfo.imageData,
          filename: bannerInfo.filename,
          timestamp: bannerInfo.timestamp,
          status: bannerInfo.status,
        });

        this.notifyBannerUpdateCallbacks();
      }
    } catch (error) {
      console.error("BannerService: Failed to fetch current banner:", error);

      // Update status to error
      if (this.currentBanner) {
        this.currentBanner.status = "error";
        this.notifyBannerUpdateCallbacks();
      }
    }
  }

  /**
   * Get variable value from E-Ra API
   */
  private async getVariableValue(variableName: string): Promise<string | null> {
    try {
      const gatewayToken = this.extractGatewayToken(this.config.authToken);
      if (!gatewayToken) {
        throw new Error("Invalid auth token");
      }

      const response = await fetch(
        `${this.config.baseUrl}/api/v1/devices/${gatewayToken}/variables/${variableName}`,
        {
          method: "GET",
          headers: {
            Authorization: this.config.authToken,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || null;
    } catch (error) {
      console.error(
        `BannerService: Failed to get variable ${variableName}:`,
        error
      );
      return null;
    }
  }

  /**
   * Map banner status from E-Ra to internal status
   */
  private mapBannerStatus(eraStatus: string | null): BannerData["status"] {
    if (!eraStatus) return "none";

    switch (eraStatus.toLowerCase()) {
      case "uploaded":
      case "active":
        return "active";
      case "updating":
        return "updating";
      case "error":
        return "error";
      default:
        return "none";
    }
  }

  /**
   * Check if banner has changed
   */
  private hasBannerChanged(newBanner: BannerData): boolean {
    if (!this.currentBanner) return true;

    return (
      this.currentBanner.imageData !== newBanner.imageData ||
      this.currentBanner.filename !== newBanner.filename ||
      this.currentBanner.timestamp.getTime() !==
        newBanner.timestamp.getTime() ||
      this.currentBanner.status !== newBanner.status
    );
  }

  /**
   * Get current banner data
   */
  public getCurrentBanner(): BannerData | null {
    return this.currentBanner;
  }

  /**
   * Convert Base64 to blob URL for display
   */
  public getBannerImageUrl(): string | null {
    if (!this.currentBanner?.imageData) return null;

    try {
      const byteCharacters = atob(this.currentBanner.imageData);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(
        "BannerService: Failed to convert image data to URL:",
        error
      );
      return null;
    }
  }

  /**
   * Manual refresh of banner data
   */
  public async refreshBanner(): Promise<void> {
    console.log("BannerService: Manual refresh requested");
    await this.fetchCurrentBanner();
  }

  /**
   * Notify all banner update callbacks
   */
  private notifyBannerUpdateCallbacks(): void {
    if (!this.currentBanner) return;

    this.bannerUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.currentBanner!);
      } catch (error) {
        console.error("BannerService: Error in banner update callback:", error);
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
        console.error("BannerService: Error in status update callback:", error);
      }
    });
  }

  /**
   * Subscribe to banner updates
   */
  public onBannerUpdate(callback: (data: BannerData) => void): () => void {
    this.bannerUpdateCallbacks.push(callback);

    // Immediately call with current data if available
    if (this.currentBanner) {
      try {
        callback(this.currentBanner);
      } catch (error) {
        console.error(
          "BannerService: Error in initial banner callback:",
          error
        );
      }
    }

    return () => {
      const index = this.bannerUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.bannerUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to status updates
   */
  public onStatusUpdate(callback: (status: any) => void): () => void {
    this.statusUpdateCallbacks.push(callback);

    // Immediately call with current status
    try {
      callback(this.getStatus());
    } catch (error) {
      console.error("BannerService: Error in initial status callback:", error);
    }

    return () => {
      const index = this.statusUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isRunning: boolean;
    lastUpdate: Date | null;
    currentStatus: BannerData["status"] | "inactive";
    hasBanner: boolean;
  } {
    const mqttStatus = this.mqttService?.getStatus();
    return {
      isRunning: mqttStatus?.connected || false,
      lastUpdate: this.currentBanner?.timestamp || null,
      currentStatus: this.currentBanner?.status || "inactive",
      hasBanner: !!this.currentBanner?.imageData,
    };
  }

  /**
   * Test connection to E-Ra API
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log("BannerService: Testing E-Ra API connection...");

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

      const gatewayToken = this.extractGatewayToken(this.config.authToken);
      if (!gatewayToken) {
        return {
          success: false,
          message: "Could not extract GATEWAY_TOKEN from authToken",
        };
      }

      // Test API connection by trying to get device status
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/devices/${gatewayToken}`,
        {
          method: "GET",
          headers: {
            Authorization: this.config.authToken,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );

      if (!response.ok) {
        return {
          success: false,
          message: `API connection failed: HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        message: "E-Ra API connection successful",
      };
    } catch (error: any) {
      console.error("BannerService: API connection test failed:", error);
      return {
        success: false,
        message: `API connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<BannerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.authToken || newConfig.baseUrl || newConfig.mqttApiKey) {
      // Reinitialize services with new config
      this.destroy();
      this.initializeMqttService();
    }

    console.log("BannerService: Configuration updated");
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

    // Clear all callbacks
    this.bannerUpdateCallbacks = [];
    this.statusUpdateCallbacks = [];
    this.currentBanner = null;
    console.log("BannerService: Destroyed");
  }
}

export default BannerService;
