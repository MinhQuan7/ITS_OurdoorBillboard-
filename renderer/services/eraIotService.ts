/**
 * E-Ra IoT Platform Service
 * Integrates with E-Ra IoT Platform API to fetch real sensor data
 *
 * Based on E-Ra API documentation:
 * - Authentication using AUTHTOKEN
 * - Endpoint: /api/chip_manager/configs/{id}/current_value/
 * - Base URL: https://backend.eoh.io
 */

import axios, { AxiosInstance } from "axios";

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
  authToken: string;
  baseUrl: string;
  sensorConfigs: {
    temperature: number;
    humidity: number;
    pm25: number;
    pm10: number;
  };
  updateInterval: number; // minutes
  timeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

class EraIotService {
  private config: EraIotConfig;
  private httpClient!: AxiosInstance;
  private currentData: EraIotData | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private isUpdating: boolean = false;
  private retryCount: number = 0;

  constructor(config: EraIotConfig) {
    this.config = config;
    this.initializeHttpClient();
    console.log("EraIotService: Initialized with config", {
      baseUrl: this.config.baseUrl,
      hasAuthToken: !!this.config.authToken,
      sensorConfigs: this.config.sensorConfigs,
    });
  }

  private initializeHttpClient(): void {
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        Authorization: this.config.authToken,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "ITS-Billboard-EraIoT/1.0",
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(
          `EraIotService: API Request - ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
        return config;
      },
      (error) => {
        console.error("EraIotService: Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(
          `EraIotService: API Response - Status ${response.status} for ${response.config.url}`
        );
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(
            `EraIotService: API Error - Status ${error.response.status}:`,
            error.response.data
          );
        } else if (error.request) {
          console.error(
            "EraIotService: Network Error - No response received:",
            error.request
          );
        } else {
          console.error("EraIotService: Request Error:", error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Start periodic sensor data updates
   */
  public startPeriodicUpdates(): void {
    if (this.updateTimer) {
      this.stopPeriodicUpdates();
    }

    // Initial fetch
    this.fetchSensorData();

    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.fetchSensorData();
    }, this.config.updateInterval * 60 * 1000);

    console.log(
      `EraIotService: Started periodic updates every ${this.config.updateInterval} minutes`
    );
  }

  /**
   * Stop periodic updates
   */
  public stopPeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log("EraIotService: Stopped periodic updates");
    }
  }

  /**
   * Fetch current sensor data from E-Ra IoT Platform
   */
  private async fetchSensorData(): Promise<void> {
    if (this.isUpdating) {
      console.log("EraIotService: Update already in progress, skipping");
      return;
    }

    this.isUpdating = true;
    console.log("EraIotService: Starting sensor data fetch");

    try {
      const sensorPromises = [
        this.fetchSensorValue(
          this.config.sensorConfigs.temperature,
          "temperature"
        ),
        this.fetchSensorValue(this.config.sensorConfigs.humidity, "humidity"),
        this.fetchSensorValue(this.config.sensorConfigs.pm25, "pm25"),
        this.fetchSensorValue(this.config.sensorConfigs.pm10, "pm10"),
      ];

      const results = await Promise.allSettled(sensorPromises);

      const sensorData: Partial<EraIotData> = {
        temperature: null,
        humidity: null,
        pm25: null,
        pm10: null,
        lastUpdated: new Date(),
      };

      let successCount = 0;
      let errorMessages: string[] = [];

      results.forEach((result, index) => {
        const sensorNames = ["temperature", "humidity", "pm25", "pm10"];
        const sensorName = sensorNames[index] as keyof typeof sensorData;

        if (result.status === "fulfilled" && result.value !== null) {
          sensorData[sensorName] = result.value as any;
          successCount++;
          console.log(`EraIotService: ${sensorName} = ${result.value}`);
        } else {
          console.error(
            `EraIotService: Failed to fetch ${sensorName}:`,
            result.status === "rejected" ? result.reason : "No data"
          );
          if (result.status === "rejected") {
            errorMessages.push(
              `${sensorName}: ${result.reason.message || "Unknown error"}`
            );
          }
        }
      });

      // Determine overall status
      let status: EraIotData["status"];
      if (successCount === 4) {
        status = "success";
        this.retryCount = 0; // Reset retry count on success
      } else if (successCount > 0) {
        status = "partial";
      } else {
        status = "error";
      }

      this.currentData = {
        ...sensorData,
        status,
        errorMessage:
          errorMessages.length > 0 ? errorMessages.join("; ") : undefined,
      } as EraIotData;

      console.log("EraIotService: Data update completed", {
        status,
        successCount: `${successCount}/4`,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        pm25: sensorData.pm25,
        pm10: sensorData.pm10,
      });
    } catch (error) {
      console.error(
        "EraIotService: Critical error during sensor fetch:",
        error
      );
      this.handleFetchError(error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Fetch individual sensor value from E-Ra API
   */
  private async fetchSensorValue(
    configId: number,
    sensorName: string
  ): Promise<number | null> {
    try {
      console.log(
        `EraIotService: Fetching ${sensorName} (config ID: ${configId})`
      );

      const response = await this.httpClient.get(
        `/api/chip_manager/configs/${configId}/current_value/`
      );

      console.log(
        `EraIotService: Raw API response for ${sensorName}:`,
        response.data
      );

      if (response.data) {
        let value: number | null = null;

        // Try different response formats from E-Ra API
        if (typeof response.data.current_value_only === "number") {
          value = response.data.current_value_only;
        } else if (typeof response.data.current_value === "number") {
          value = response.data.current_value;
        } else if (typeof response.data.value === "number") {
          value = response.data.value;
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          // Handle array response format
          const latest = response.data[0];
          if (typeof latest.current_value_only === "number") {
            value = latest.current_value_only;
          } else if (typeof latest.current_value === "number") {
            value = latest.current_value;
          } else if (typeof latest.value === "number") {
            value = latest.value;
          }
        } else if (typeof response.data === "number") {
          // Direct number response
          value = response.data;
        }

        if (value !== null && !isNaN(value)) {
          console.log(`EraIotService: ${sensorName} parsed value: ${value}`);
          return value;
        } else {
          console.warn(
            `EraIotService: Could not parse value for ${sensorName}:`,
            response.data
          );
          return null;
        }
      } else {
        console.warn(
          `EraIotService: Empty response for ${sensorName}:`,
          response.data
        );
        return null;
      }
    } catch (error) {
      console.error(`EraIotService: Error fetching ${sensorName}:`, error);
      throw error;
    }
  }

  /**
   * Handle fetch errors with retry logic
   */
  private handleFetchError(error: any): void {
    this.retryCount++;
    console.error(
      `EraIotService: Fetch failed (attempt ${this.retryCount}/${this.config.retryAttempts}):`,
      error
    );

    if (this.retryCount >= this.config.retryAttempts) {
      console.error(
        "EraIotService: Max retry attempts reached, using fallback data"
      );
      this.useFallbackData(error);
      this.retryCount = 0;
    } else {
      const retryDelay =
        this.config.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
      console.log(`EraIotService: Retrying in ${retryDelay}ms`);

      setTimeout(() => {
        this.fetchSensorData();
      }, retryDelay);
    }
  }

  /**
   * Use fallback data when all retries fail
   */
  private useFallbackData(error: any): void {
    this.currentData = {
      temperature: null,
      humidity: null,
      pm25: 15.0, // Fallback PM2.5 value
      pm10: 25.0, // Fallback PM10 value
      lastUpdated: new Date(),
      status: "error",
      errorMessage: `Connection failed: ${error.message || "Unknown error"}`,
    };
    console.log("EraIotService: Using fallback sensor data");
  }

  /**
   * Get current sensor data
   */
  public getCurrentData(): EraIotData | null {
    return this.currentData;
  }

  /**
   * Manual refresh of sensor data
   */
  public async refreshData(): Promise<void> {
    console.log("EraIotService: Manual refresh requested");
    await this.fetchSensorData();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<EraIotConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.authToken || newConfig.baseUrl) {
      this.initializeHttpClient();
    }

    if (newConfig.updateInterval) {
      this.startPeriodicUpdates();
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
    return {
      isRunning: this.updateTimer !== null,
      lastUpdate: this.currentData?.lastUpdated || null,
      retryCount: this.retryCount,
      currentStatus: this.currentData?.status || "inactive",
    };
  }

  /**
   * Test API connection with multiple authentication formats
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log("EraIotService: Testing API connection...");

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

      // Test with temperature sensor (config ID: 138997)
      const testEndpoint = `/api/chip_manager/configs/${this.config.sensorConfigs.temperature}/current_value/`;

      try {
        const response = await this.httpClient.get(testEndpoint);

        if (response.status === 200) {
          return {
            success: true,
            message: "Connection successful - API authentication working",
          };
        } else {
          return {
            success: false,
            message: `Unexpected response status: ${response.status}`,
          };
        }
      } catch (firstError: any) {
        // If first attempt fails, try with different auth header formats
        console.log(
          "EraIotService: First auth format failed, trying alternatives..."
        );

        if (firstError.response?.status === 404) {
          return {
            success: false,
            message:
              "API endpoint not found (404) - check sensor config IDs or API URL",
          };
        }

        if (
          firstError.response?.status === 401 ||
          firstError.response?.status === 403
        ) {
          // Try alternative authentication formats
          const altHeaders = [
            { Authorization: `Bearer ${this.config.authToken}` },
            { apiKey: this.config.authToken },
            { "X-API-Key": this.config.authToken },
          ];

          for (const headers of altHeaders) {
            try {
              const altResponse = await axios.get(
                `${this.config.baseUrl}${testEndpoint}`,
                {
                  headers: {
                    ...headers,
                    "Content-Type": "application/json",
                    "User-Agent": "ITS-Billboard-EraIoT/1.0",
                  },
                  timeout: this.config.timeout,
                }
              );

              if (altResponse.status === 200) {
                return {
                  success: true,
                  message: `Connection successful with alternative auth format: ${
                    Object.keys(headers)[0]
                  }`,
                };
              }
            } catch (altError) {
              // Continue to next format
              console.log(
                `Alternative auth format ${Object.keys(headers)[0]} failed`
              );
            }
          }
        }

        throw firstError;
      }
    } catch (error: any) {
      console.error("EraIotService: Connection test failed:", error);

      let message = "Connection failed";
      if (error.response) {
        message += ` - Status ${error.response.status}`;
        if (error.response.status === 401) {
          message += " (Unauthorized - check AUTHTOKEN)";
        } else if (error.response.status === 403) {
          message += " (Forbidden - AUTHTOKEN may not have access)";
        } else if (error.response.status === 404) {
          message += " (Not Found - check API endpoint or sensor config IDs)";
        }
      } else if (error.code === "ENOTFOUND") {
        message += " (DNS resolution failed - check internet connection)";
      } else if (error.code === "ECONNREFUSED") {
        message += " (Connection refused - server may be down)";
      } else if (error.code === "ETIMEDOUT") {
        message += " (Timeout - server not responding)";
      }

      return {
        success: false,
        message: `${message}: ${error.message}`,
      };
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopPeriodicUpdates();
    this.currentData = null;
    console.log("EraIotService: Destroyed");
  }
}

export default EraIotService;
