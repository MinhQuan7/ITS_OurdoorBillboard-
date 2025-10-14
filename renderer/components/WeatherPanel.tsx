// WeatherPanel.tsx - Professional weather display component
// Designed for 24/7 outdoor billboard operation

import React, { useState, useEffect } from "react";
import WeatherService, {
  WeatherData,
  WeatherConfig,
} from "../services/weatherService";
import { EraIotConfig } from "../services/eraIotService";
import { getWeatherIcon } from "../assets/weather-icons/weatherIcons";
import "./WeatherPanel.css";

interface WeatherPanelProps {
  className?: string;
  onWeatherUpdate?: (data: WeatherData | null) => void;
}

// Global weather service instance
class GlobalWeatherServiceManager {
  private static instance: WeatherService | null = null;
  private static subscribers: Set<(data: WeatherData | null) => void> =
    new Set();

  public static getInstance(): WeatherService {
    if (!GlobalWeatherServiceManager.instance) {
      const weatherConfig: WeatherConfig = {
        location: {
          lat: 16.4637, // Huế coordinates
          lon: 107.5909,
          city: "TP. THỪA THIÊN HUẾ",
        },
        updateInterval: 10, // Update every 10 minutes
        retryInterval: 3, // Retry every 3 minutes on failure
        maxRetries: 5, // More retries for reliability
      };

      // Load E-Ra IoT configuration
      const eraIotConfig: EraIotConfig | undefined =
        GlobalWeatherServiceManager.loadEraIotConfig();

      try {
        console.log(
          "WeatherServiceManager: Creating weather service for",
          weatherConfig.location.city
        );
        console.log(
          "WeatherServiceManager: E-Ra IoT config available:",
          !!eraIotConfig
        );

        GlobalWeatherServiceManager.instance = new WeatherService(
          weatherConfig,
          eraIotConfig
        );
        console.log(
          "WeatherServiceManager: Weather service created successfully"
        );
      } catch (error) {
        console.error(
          "WeatherServiceManager: Failed to create weather service:",
          error
        );
        throw error;
      }

      // Set up data change notifications - check more frequently
      setInterval(() => {
        const data =
          GlobalWeatherServiceManager.instance?.getCurrentWeather() || null;
        GlobalWeatherServiceManager.notifySubscribers(data);
      }, 10000); // Check for updates every 10 seconds
    }

    return GlobalWeatherServiceManager.instance;
  }

  public static subscribe(
    callback: (data: WeatherData | null) => void
  ): () => void {
    console.log("WeatherServiceManager: Subscribe called");
    GlobalWeatherServiceManager.subscribers.add(callback);

    // Get or create instance first
    console.log("WeatherServiceManager: Getting instance...");
    const instance = GlobalWeatherServiceManager.getInstance();

    // Immediately provide current data
    const currentData = instance?.getCurrentWeather() || null;
    console.log(
      "WeatherServiceManager: Current data available:",
      !!currentData
    );
    callback(currentData);

    // Return unsubscribe function
    return () => {
      GlobalWeatherServiceManager.subscribers.delete(callback);
    };
  }

  private static notifySubscribers(data: WeatherData | null): void {
    GlobalWeatherServiceManager.subscribers.forEach((callback) =>
      callback(data)
    );
  }

  /**
   * Load E-Ra IoT configuration from config.json
   */
  private static loadEraIotConfig(): EraIotConfig | undefined {
    try {
      // Access config from electron main process if available
      if (typeof window !== "undefined" && (window as any).electronAPI) {
        const config = (window as any).electronAPI.getConfig?.();
        if (
          config?.eraIot &&
          config.eraIot.enabled &&
          config.eraIot.authToken
        ) {
          console.log(
            "WeatherServiceManager: Loading E-Ra IoT config from Electron"
          );
          return {
            authToken: config.eraIot.authToken,
            baseUrl: config.eraIot.baseUrl || "https://backend.eoh.io",
            sensorConfigs: config.eraIot.sensorConfigs || {
              temperature: null,
              humidity: null,
              pm25: null,
              pm10: null,
            },
            updateInterval: config.eraIot.updateInterval || 5,
            timeout: config.eraIot.timeout || 15000,
            retryAttempts: config.eraIot.retryAttempts || 3,
            retryDelay: config.eraIot.retryDelay || 2000,
          };
        }
      }

      // Fallback: Try to read from localStorage or use demo config
      const storedConfig = localStorage.getItem("eraIotConfig");
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        if (parsedConfig.authToken) {
          console.log(
            "WeatherServiceManager: Loading E-Ra IoT config from localStorage"
          );
          return parsedConfig;
        }
      }

      console.log("WeatherServiceManager: No valid E-Ra IoT config found");
      return undefined;
    } catch (error) {
      console.error(
        "WeatherServiceManager: Failed to load E-Ra IoT config:",
        error
      );
      return undefined;
    }
  }
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({
  className = "",
  onWeatherUpdate,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "error" | "offline"
  >("offline");
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  useEffect(() => {
    console.log("WeatherPanel: Initializing weather panel");

    // Subscribe to global weather service
    const unsubscribe = GlobalWeatherServiceManager.subscribe((data) => {
      console.log(
        "WeatherPanel: Subscription callback called with data:",
        !!data
      );

      if (data) {
        setWeatherData(data);
        setConnectionStatus("connected");
        setIsLoading(false);

        // Notify parent component about weather update
        if (onWeatherUpdate) {
          onWeatherUpdate(data);
        }

        console.log("WeatherPanel: Weather data updated:", {
          city: data.cityName,
          temp: data.temperature,
          humidity: data.humidity,
          condition: data.weatherCondition,
          lastUpdated: data.lastUpdated.toLocaleTimeString(),
        });
      } else {
        console.log(
          "WeatherPanel: No weather data, keeping loading state or showing error"
        );
        if (!isLoading) {
          setConnectionStatus("error");
        }

        // Notify parent component
        if (onWeatherUpdate) {
          onWeatherUpdate(null);
        }
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [isLoading, onWeatherUpdate]);

  // Format UV Index level
  const getUVLevel = (uvIndex: number): string => {
    if (uvIndex <= 2) return "Thấp";
    if (uvIndex <= 5) return "Trung bình";
    if (uvIndex <= 7) return "Cao";
    if (uvIndex <= 10) return "Rất cao";
    return "Cực cao";
  };

  // Get rain probability text
  const getRainText = (rainProb: number): string => {
    if (rainProb >= 80) return "Chắc chắn mưa";
    if (rainProb >= 60) return "Có thể mưa";
    if (rainProb >= 30) return "Ít khả năng mưa";
    return "Không mưa";
  };

  // Get air quality CSS class based on AQI value
  const getAirQualityClass = (aqi: number): string => {
    switch (aqi) {
      case 1:
        return "good";
      case 2:
        return "fair";
      case 3:
        return "moderate";
      case 4:
        return "poor";
      case 5:
        return "very-poor";
      default:
        return "";
    }
  };

  // Handle manual refresh with click throttling
  const handleRefresh = async () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Prevent rapid clicking (throttle to 2 seconds)
    if (timeSinceLastClick < 2000) {
      console.log("WeatherPanel: Click throttled");
      return;
    }

    setLastClickTime(now);
    console.log("WeatherPanel: Manual refresh requested");

    try {
      setIsLoading(true);
      const weatherService = GlobalWeatherServiceManager.getInstance();
      await weatherService.refreshWeatherData();

      // Give some time for the service to update
      setTimeout(() => {
        const updatedData = weatherService.getCurrentWeather();
        if (updatedData) {
          setWeatherData(updatedData);
          setConnectionStatus("connected");
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("WeatherPanel: Manual refresh failed:", error);
      setConnectionStatus("error");
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading && !weatherData) {
    return (
      <div className={`weather-panel loading ${className}`}>
        <div className="weather-title">TP. THỪA THIÊN HUẾ</div>
        <div className="weather-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Đang tải...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (!weatherData && connectionStatus === "error") {
    return (
      <div className={`weather-panel error ${className}`}>
        <div className="weather-title">TP. THỪA THIÊN HUẾ</div>
        <div className="weather-error">
          <div className="error-icon">⚠</div>
          <div className="error-text">Lỗi kết nối</div>
          <button className="retry-button" onClick={handleRefresh}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  const weatherIcon = getWeatherIcon(
    weatherData.weatherCode,
    weatherData.weatherCondition
  );

  // Get weather type for styling
  const getWeatherType = (condition: string): string => {
    if (
      condition.includes("quang") ||
      condition.includes("nắng") ||
      condition.includes("Trời quang")
    ) {
      return "sunny";
    }
    if (condition.includes("mưa") || condition.includes("phùn")) {
      return "rainy";
    }
    if (
      condition.includes("mây") ||
      condition.includes("u ám") ||
      condition.includes("U ám")
    ) {
      return "cloudy";
    }
    if (condition.includes("dông") || condition.includes("sấm")) {
      return "stormy";
    }
    return "default";
  };

  const weatherType = getWeatherType(weatherData.weatherCondition);

  return (
    <div
      className={`weather-panel unified ${weatherType} ${className}`}
      onClick={handleRefresh}
    >
      {/* Background overlay for better text readability */}
      <div className="weather-overlay"></div>

      {/* Header with city name */}
      <div className="weather-header">
        <div className="city-name">{weatherData.cityName}</div>
        <div className={`connection-indicator ${connectionStatus}`}></div>
      </div>

      {/* Unified content layout - single integrated block */}
      <div className="weather-unified-content">
        {/* Main temperature and weather icon */}
        <div className="weather-main-display">
          <div className="weather-icon-large">
            <div
              className={`weather-icon-svg ${weatherType}`}
              dangerouslySetInnerHTML={{ __html: weatherIcon }}
            />
          </div>
          <div className="temperature-main">
            <div className="temp-value">{weatherData.temperature}°</div>
            <div className="temp-feels">- {weatherData.feelsLike}°</div>
          </div>
        </div>

        {/* Integrated measurements grid */}
        <div className="weather-measurements-grid">
          <div className="measure-item">
            <span className="measure-label">Độ ẩm</span>
            <span className="measure-value">{weatherData.humidity}%</span>
          </div>
          <div className="measure-item">
            <span className="measure-label">Mưa</span>
            <span className="measure-value">
              {weatherData.rainProbability}%
            </span>
          </div>
          <div className="measure-item">
            <span className="measure-label">UV</span>
            <span className="measure-value">
              {getUVLevel(weatherData.uvIndex)}
            </span>
          </div>
          <div className="measure-item">
            <span className="measure-label">Gió</span>
            <span className="measure-value">{weatherData.windSpeed} km/h</span>
          </div>
        </div>

        {/* Device measurements section */}
        <div className="device-measurements">
          <div className="device-section-title">THIẾT BỊ ĐO</div>
          <div className="device-grid">
            <div className="device-item">
              <span className="device-label">Nhiệt độ</span>
              <span className="device-value">{weatherData.temperature}°</span>
            </div>
            <div className="device-item">
              <span className="device-label">Độ ẩm</span>
              <span className="device-value">{weatherData.humidity}%</span>
            </div>
            <div className="device-item">
              <span className="device-label">PM2.5</span>
              <span className="device-value">
                {weatherData.pm25}
                <span className="unit">μg/m³</span>
              </span>
            </div>
            <div className="device-item">
              <span className="device-label">PM10</span>
              <span className="device-value">
                {weatherData.pm10}
                <span className="unit">μg/m³</span>
              </span>
            </div>
          </div>
        </div>

        {/* Air quality status */}
        <div className="air-quality-section">
          <div className="air-quality-text">
            Chất lượng không khí: {weatherData.airQuality}
          </div>
          <div className="air-quality-badge">TỐT</div>
        </div>
      </div>

      {/* Loading overlay for refresh */}
      {isLoading && (
        <div className="refresh-overlay">
          <div className="refresh-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default WeatherPanel;
