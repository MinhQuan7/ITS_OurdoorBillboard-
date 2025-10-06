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

// Global weather service instance to prevent recreation
let globalWeatherService: WeatherService | null = null;

const WeatherPanel: React.FC<WeatherPanelProps> = ({ className = "" }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "error" | "offline"
  >("offline");
  const [weatherService, setWeatherService] = useState<WeatherService | null>(
    null
  );

  // Weather service configuration for Thừa Thiên Huế
  const weatherConfig: WeatherConfig = {
    location: {
      lat: 16.4637, // Huế coordinates
      lon: 107.5909,
      city: "TP. THỪA THIÊN HUẾ",
    },
    updateInterval: 15, // Update every 15 minutes
    retryInterval: 5, // Retry every 5 minutes on failure
    maxRetries: 3,
  };

  useEffect(() => {
    // Use existing global service or create new one
    if (!globalWeatherService) {
      console.log("WeatherPanel: Creating new global weather service");
      globalWeatherService = new WeatherService(weatherConfig);
    } else {
      console.log("WeatherPanel: Reusing existing global weather service");
    }
    
    setWeatherService(globalWeatherService);

    // Set up polling for weather data
    const pollWeatherData = () => {
      const data = globalWeatherService!.getCurrentWeather();
      const status = globalWeatherService!.getStatus();

      if (data) {
        setWeatherData(data);
        setConnectionStatus("connected");
        setIsLoading(false);
        console.log("WeatherPanel: Updated weather data:", {
          temp: data.temperature,
          humidity: data.humidity,
          lastUpdated: data.lastUpdated.toLocaleTimeString()
        });
      } else {
        setConnectionStatus("error");
        console.log("WeatherPanel: No weather data available");
      }
    };

    // Initial poll
    pollWeatherData();

    // Poll every 30 seconds to update UI
    const pollInterval = setInterval(pollWeatherData, 30000);

    // Cleanup on unmount - Don't destroy global service
    return () => {
      clearInterval(pollInterval);
      // Keep global service running for other components
    };
  }, []);

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

  // Handle manual refresh - Only refresh if data is stale (older than 5 minutes)
  const handleRefresh = async () => {
    if (weatherService && weatherData) {
      const now = new Date();
      const dataAge = now.getTime() - weatherData.lastUpdated.getTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      // Only refresh if data is older than 5 minutes
      if (dataAge > fiveMinutes) {
        console.log("WeatherPanel: Data is stale, refreshing...");
        setIsLoading(true);
        await weatherService.refreshWeatherData();
        
        // Update UI with new data
        const newData = weatherService.getCurrentWeather();
        if (newData) {
          setWeatherData(newData);
        }
        setIsLoading(false);
      } else {
        console.log("WeatherPanel: Data is fresh, no refresh needed");
      }
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
      {/* Title */}
      <div className="weather-title">
        {weatherData.cityName}
        <div className={`connection-indicator ${connectionStatus}`}></div>
      </div>

      {/* Main temperature and weather icon */}
      <div className="weather-main">
        <div
          className={`weather-icon ${weatherType}`}
          dangerouslySetInnerHTML={{ __html: weatherIcon }}
        />
        <div className="temperature-section">
          <div className="temperature-main">{weatherData.temperature}°</div>
          <div className="temperature-range">{weatherData.feelsLike}°</div>
        </div>
      </div>

      {/* Weather condition */}
      <div className="weather-condition">{weatherData.weatherCondition}</div>

      {/* Weather details grid */}
      <div className="weather-details">
        <div className="weather-detail-item">
          <span className="detail-label">Độ ẩm</span>
          <span className="detail-value">{weatherData.humidity}%</span>
        </div>
        <div className="weather-detail-item">
          <span className="detail-label">Mưa</span>
          <span className="detail-value">{weatherData.rainProbability}%</span>
        </div>
        <div className="weather-detail-item">
          <span className="detail-label">UV</span>
          <span className="detail-value">
            {getUVLevel(weatherData.uvIndex)}
          </span>
        </div>
        <div className="weather-detail-item">
          <span className="detail-label">Gió</span>
          <span className="detail-value">{weatherData.windSpeed} km/h</span>
        </div>
      </div>

      {/* Air quality with enhanced styling */}
      <div className={`air-quality ${getAirQualityClass(weatherData.aqi)}`}>
        Chất lượng không khí: {weatherData.airQuality}
      </div>

      {/* Weather Alert Banner */}
      {(weatherData.rainProbability > 70 ||
        weatherData.weatherCondition.includes("mưa to") ||
        weatherData.weatherCondition.includes("dông")) && (
        <div className="weather-alert">
          <div className="alert-icon">⚠</div>
          <div className="alert-text">
            {weatherData.weatherCondition.includes("dông")
              ? "CẢNH BÁO DÔNG BẢO"
              : "CẢNH BÁO MƯA LỚN"}
          </div>
        </div>
      )}

      {/* Last updated indicator with data source info */}
      <div className="last-updated">
        Cập nhật:{" "}
        {weatherData.lastUpdated.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {/* Debug info - can be removed in production */}
        <span className="debug-info">
          ({connectionStatus === 'connected' ? 'API' : 'Cache'})
        </span>
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
