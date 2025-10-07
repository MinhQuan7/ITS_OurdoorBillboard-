// WeatherPanel.tsx - Professional weather display component
// Designed for 24/7 outdoor billboard operation

import React, { useState, useEffect } from "react";
import WeatherService, {
  WeatherData,
  WeatherConfig,
} from "../services/weatherService";
import { getWeatherIcon } from "../assets/weather-icons/weatherIcons";
import "./WeatherPanel.css";

interface WeatherPanelProps {
  className?: string;
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

      try {
        console.log(
          "WeatherServiceManager: Creating weather service for",
          weatherConfig.location.city
        );
        console.log(
          "WeatherServiceManager: WeatherService constructor available:",
          typeof WeatherService
        );
        GlobalWeatherServiceManager.instance = new WeatherService(
          weatherConfig
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
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ className = "" }) => {
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
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [isLoading]);

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
      className={`weather-panel ${weatherType} ${className}`}
      onClick={handleRefresh}
    >
      {/* Header with city name */}
      <div className="weather-header">
        <div className="city-name">{weatherData.cityName}</div>
        <div className={`connection-indicator ${connectionStatus}`}></div>
      </div>

      {/* Main content - two column layout */}
      <div className="weather-content">
        {/* Left column - Main weather info */}
        <div className="weather-left">
          <div className="temperature-display">
            <div className="temp-main-container">
              <div className="temp-main">{weatherData.temperature}°</div>
              <div className="weather-icon-inline">
                <div
                  className={`weather-icon-svg ${weatherType}`}
                  dangerouslySetInnerHTML={{ __html: weatherIcon }}
                />
              </div>
            </div>
            <div className="temp-feels">- {weatherData.feelsLike}°</div>
          </div>

          <div className="weather-details-left">
            <div className="detail-row">
              <span className="detail-text">Độ ẩm {weatherData.humidity}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-text">
                Mưa {weatherData.rainProbability}%
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-text">
                UV {getUVLevel(weatherData.uvIndex)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-text">
                Gió {weatherData.windSpeed} km/h
              </span>
            </div>
          </div>

          <div className="air-quality-status">
            Chất lượng không khí: {weatherData.airQuality}
          </div>
        </div>

        {/* Right column - Device measurements */}
        <div className="weather-right">
          <div className="device-title">THIẾT BỊ ĐO</div>

          <div className="measurement-item">
            <div className="measurement-label">Nhiệt độ</div>
            <div className="measurement-value">{weatherData.temperature}°</div>
          </div>

          <div className="measurement-item">
            <div className="measurement-label">Độ ẩm</div>
            <div className="measurement-value">{weatherData.humidity}%</div>
          </div>

          <div className="measurement-item">
            <div className="measurement-label">PM2.5</div>
            <div className="measurement-value">
              {weatherData.pm25}
              <span className="unit">μg/m³</span>
            </div>
          </div>

          <div className="measurement-item">
            <div className="measurement-label">PM10</div>
            <div className="measurement-value">
              {weatherData.pm10}
              <span className="unit">μg/m³</span>
            </div>
          </div>

          <div className="air-quality-badge">TỐT</div>
        </div>
      </div>

      {/* Weather Alert Banner - matches the red banner design */}
      {(weatherData.rainProbability > 70 ||
        weatherData.weatherCondition.includes("mưa to") ||
        weatherData.weatherCondition.includes("dông")) && (
        <div className="weather-alert-banner">
          <div className="alert-icon-warning">!</div>
          <div className="alert-text-large">CẢNH BÁO MƯA LỚN</div>
        </div>
      )}

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
