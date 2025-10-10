// build-renderer.js - Simple build script to bundle React components
const fs = require("fs");
const path = require("path");

console.log("Building renderer components...");

// For now, we'll create a simple bundled app.js that imports our TypeScript components
const bundleContent = `
// app-built.js - Generated bundle from TypeScript components
// This replaces the old app.js with real API integration

// Import React from CDN (already loaded in HTML)
const { useState, useEffect } = React;

// Weather Icons System
const WeatherIcons = {
  CLEAR_DAY: \`<svg viewBox="0 0 64 64" fill="currentColor">
    <circle cx="32" cy="32" r="10" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
    <g stroke="#FFD700" stroke-width="3" stroke-linecap="round">
      <line x1="32" y1="8" x2="32" y2="16"/>
      <line x1="32" y1="48" x2="32" y2="56"/>
      <line x1="13.86" y1="13.86" x2="19.44" y2="19.44"/>
      <line x1="44.56" y1="44.56" x2="50.14" y2="50.14"/>
      <line x1="8" y1="32" x2="16" y2="32"/>
      <line x1="48" y1="32" x2="56" y2="32"/>
      <line x1="13.86" y1="50.14" x2="19.44" y2="44.56"/>
      <line x1="44.56" y1="19.44" x2="50.14" y2="13.86"/>
    </g>
  </svg>\`,
  PARTLY_CLOUDY: \`<svg viewBox="0 0 64 64" fill="currentColor">
    <circle cx="20" cy="20" r="6" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
    <path d="M44 28c4 0 8 3 8 7s-4 7-8 7H20c-5 0-9-4-9-9s4-9 9-9c1 0 2 0 3 1 2-6 8-10 15-10 8 0 15 6 15 14v-1z" fill="#B0C4DE" stroke="#87CEEB" stroke-width="1"/>
  </svg>\`,
  CLOUDY: \`<svg viewBox="0 0 64 64" fill="currentColor">
    <path d="M48 35c3 0 6 2 6 5s-3 5-6 5H18c-4 0-8-3-8-8s4-8 8-8c1 0 2 0 3 1 2-5 7-9 13-9 7 0 13 5 13 12 0-1 0-1 1-1 2-2 5-3 8-3z" fill="#B0C4DE" stroke="#87CEEB" stroke-width="2"/>
  </svg>\`,
  RAINY: \`<svg viewBox="0 0 64 64" fill="currentColor">
    <path d="M48 30c3 0 6 2 6 5s-3 5-6 5H18c-4 0-8-3-8-8s4-8 8-8c1 0 2 0 3 1 2-5 7-9 13-9 7 0 13 5 13 12z" fill="#87CEEB" stroke="#4682B4" stroke-width="2"/>
    <g stroke="#4682B4" stroke-width="2" stroke-linecap="round">
      <line x1="18" y1="44" x2="20" y2="52"/>
      <line x1="26" y1="42" x2="28" y2="50"/>
      <line x1="34" y1="44" x2="36" y2="52"/>
      <line x1="42" y1="42" x2="44" y2="50"/>
    </g>
  </svg>\`,
  DEFAULT: \`<svg viewBox="0 0 64 64" fill="currentColor">
    <circle cx="32" cy="32" r="28" fill="#B0C4DE" stroke="#87CEEB" stroke-width="3"/>
    <text x="32" y="42" text-anchor="middle" font-size="32" font-weight="bold" fill="#FFFFFF">?</text>
  </svg>\`
};

function getWeatherIcon(weatherCode, condition) {
  if (weatherCode === 0 || weatherCode === 1 || condition.includes("quang") || condition.includes("nắng")) {
    return WeatherIcons.CLEAR_DAY;
  }
  if (weatherCode === 2 || weatherCode === 3 || condition.includes("mây") || condition.includes("u ám")) {
    return WeatherIcons.PARTLY_CLOUDY;
  }
  if (condition.includes("âm u") || condition.includes("nhiều mây")) {
    return WeatherIcons.CLOUDY;
  }
  if ((weatherCode >= 61 && weatherCode <= 65) || condition.includes("mưa") || condition.includes("phùn")) {
    return WeatherIcons.RAINY;
  }
  return WeatherIcons.DEFAULT;
}

// Enhanced WeatherService with proper logging and error handling
class WeatherService {
  constructor(config) {
    this.config = config;
    this.currentData = null;
    this.isUpdating = false;
    this.retryCount = 0;
    this.initializeService();
  }

  async initializeService() {
    console.log("WeatherService: Initializing for", this.config.location.city);
    
    try {
      console.log("WeatherService: Starting initial fetch...");
      await this.fetchWeatherData();
      console.log("WeatherService: Initial fetch completed successfully");
    } catch (error) {
      console.error("WeatherService: Initial fetch failed:", error);
    }
    
    this.startPeriodicUpdates();
  }

  startPeriodicUpdates() {
    setInterval(() => {
      this.fetchWeatherData();
    }, this.config.updateInterval * 60 * 1000);
    console.log(\`WeatherService: Updates every \${this.config.updateInterval} minutes\`);
  }

  async fetchWeatherData() {
    if (this.isUpdating) {
      console.log("WeatherService: Update in progress, skipping");
      return;
    }
    
    this.isUpdating = true;
    
    try {
      console.log("WeatherService: Fetching from OpenMeteo API");
      const { lat, lon, city } = this.config.location;
      const url = \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,uv_index,apparent_temperature,precipitation_probability,visibility&timezone=Asia/Ho_Chi_Minh&forecast_days=1\`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ITS-Billboard/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      const data = await response.json();
      const current = data.current_weather;
      const hourly = data.hourly;
      
      if (!current) {
        throw new Error("No current weather data");
      }
      
      const currentHour = new Date().getHours();
      
      this.currentData = {
        cityName: city,
        temperature: Math.round(current.temperature),
        feelsLike: Math.round(hourly.apparent_temperature?.[currentHour] || current.temperature),
        humidity: Math.round(hourly.relativehumidity_2m?.[currentHour] || 70),
        windSpeed: Math.round(current.windspeed),
        uvIndex: Math.round(hourly.uv_index[currentHour] || 3),
        rainProbability: Math.round(hourly.precipitation_probability[currentHour] || 20),
        weatherCondition: this.getWeatherCondition(current.weathercode),
        weatherCode: current.weathercode,
        airQuality: "Tốt",
        aqi: 1,
        visibility: 10,
        lastUpdated: new Date(),
      };
      
      this.retryCount = 0;
      console.log('WeatherService: Data updated successfully', {
        temp: this.currentData.temperature,
        condition: this.currentData.weatherCondition,
        humidity: this.currentData.humidity
      });
      
      // Notify subscribers immediately after successful update
      GlobalWeatherServiceManager.notifySubscribers(this.currentData);
    } catch (error) {
      console.error('WeatherService: API failed', error);
      this.handleFetchFailure();
    } finally {
      this.isUpdating = false;
    }
  }

  handleFetchFailure() {
    this.retryCount++;
    console.error(\`WeatherService: Failed (\${this.retryCount}/\${this.config.maxRetries})\`);

    if (this.retryCount >= this.config.maxRetries) {
      console.error("WeatherService: Max retries reached, using fallback data");
      this.useFallbackData();
      this.retryCount = 0;
    }
  }

  useFallbackData() {
    if (!this.currentData) {
      this.currentData = {
        cityName: this.config.location.city,
        temperature: 25,
        feelsLike: 27,
        humidity: 70,
        windSpeed: 5,
        uvIndex: 3,
        rainProbability: 30,
        weatherCondition: "Không có dữ liệu",
        weatherCode: 0,
        airQuality: "Tốt",
        aqi: 1,
        visibility: 10,
        lastUpdated: new Date(),
      };
      console.log("WeatherService: Using fallback data");
    }
  }

  getWeatherCondition(code) {
    const conditions = {
      0: "Trời quang đãng",
      1: "Chủ yếu quang đãng", 
      2: "Một phần có mây",
      3: "U ám",
      45: "Sương mù",
      48: "Sương mù đóng băng",
      51: "Mưa phùn nhẹ",
      53: "Mưa phùn vừa",
      55: "Mưa phùn dày đặc",
      61: "Mưa nhẹ",
      63: "Mưa vừa", 
      65: "Mưa to",
      95: "Dông",
      96: "Dông có mưa đá nhẹ",
      99: "Dông có mưa đá to"
    };
    return conditions[code] || "Không xác định";
  }

  getCurrentWeather() {
    return this.currentData;
  }

  async refreshWeatherData() {
    if (this.currentData) {
      const dataAge = Date.now() - this.currentData.lastUpdated.getTime();
      if (dataAge < 5 * 60 * 1000) {
        console.log('WeatherService: Data is fresh, no refresh needed');
        return;
      }
    }
    console.log('WeatherService: Manual refresh requested');
    await this.fetchWeatherData();
  }
}

// Global Weather Service Manager
class GlobalWeatherServiceManager {
  static instance = null;
  static subscribers = new Set();
  
  static getInstance() {
    if (!GlobalWeatherServiceManager.instance) {
      const weatherConfig = {
        location: {
          lat: 16.4637,
          lon: 107.5909,
          city: "TP. THỪA THIÊN HUẾ",
        },
        updateInterval: 15,
        retryInterval: 5,
        maxRetries: 3,
      };
      
      console.log("Creating global weather service");
      GlobalWeatherServiceManager.instance = new WeatherService(weatherConfig);
      console.log("Global weather service created successfully");
      
      // Notify subscribers every 30 seconds
      setInterval(() => {
        const data = GlobalWeatherServiceManager.instance?.getCurrentWeather() || null;
        GlobalWeatherServiceManager.notifySubscribers(data);
      }, 30000);
    }
    
    return GlobalWeatherServiceManager.instance;
  }
  
  static subscribe(callback) {
    GlobalWeatherServiceManager.subscribers.add(callback);
    
    // Ensure instance is created first by calling getInstance
    console.log("GlobalWeatherServiceManager: Subscribe called, ensuring instance...");
    const instance = GlobalWeatherServiceManager.getInstance();
    
    // Immediately provide current data
    const currentData = instance.getCurrentWeather() || null;
    console.log("GlobalWeatherServiceManager: Providing initial data:", !!currentData);
    callback(currentData);
    
    // Return unsubscribe function
    return () => {
      GlobalWeatherServiceManager.subscribers.delete(callback);
    };
  }
  
  static notifySubscribers(data) {
    GlobalWeatherServiceManager.subscribers.forEach(callback => callback(data));
  }
}

// WeatherPanel Component with Real API Integration
function WeatherPanel({ className = "" }) {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("offline");
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    // Subscribe to global weather service
    const unsubscribe = GlobalWeatherServiceManager.subscribe((data) => {
      if (data) {
        setWeatherData(data);
        setConnectionStatus("connected");
        setIsLoading(false);
        console.log("WeatherPanel: Received weather data update:", {
          temp: data.temperature,
          humidity: data.humidity,
          lastUpdated: data.lastUpdated.toLocaleTimeString(),
          source: "GlobalService"
        });
      } else {
        setConnectionStatus("error");
        console.log("WeatherPanel: No weather data available from global service");
      }
    });

    return unsubscribe;
  }, []);

  // Handle manual refresh with intelligent caching and click throttling
  const handleRefresh = async () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    
    // Prevent rapid clicking (throttle to 2 seconds)
    if (timeSinceLastClick < 2000) {
      console.log("WeatherPanel: Click throttled, ignoring rapid click");
      return;
    }
    
    setLastClickTime(now);
    
    if (weatherData) {
      const dataAge = now - weatherData.lastUpdated.getTime();
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
      
      // Only refresh if data is older than 10 minutes (conservative approach)
      if (dataAge > tenMinutes) {
        console.log("WeatherPanel: Data is stale (>10min), requesting refresh...");
        setIsLoading(true);
        
        const weatherService = GlobalWeatherServiceManager.getInstance();
        await weatherService.refreshWeatherData();
        
        // Data will be updated through subscription, no need to manually set
        setIsLoading(false);
      } else {
        console.log(\`WeatherPanel: Data is fresh (\${Math.round(dataAge/60000)}min old), no refresh needed\`);
        
        // Visual feedback for user click even when no refresh happens
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 300);
      }
    } else {
      // No data at all, force refresh
      console.log("WeatherPanel: No data available, forcing refresh...");
      setIsLoading(true);
      const weatherService = GlobalWeatherServiceManager.getInstance();
      await weatherService.refreshWeatherData();
      setIsLoading(false);
    }
  };

  // Format UV Index level
  const getUVLevel = (uvIndex) => {
    if (uvIndex <= 2) return "Thấp";
    if (uvIndex <= 5) return "Trung bình";
    if (uvIndex <= 7) return "Cao";
    if (uvIndex <= 10) return "Rất cao";
    return "Cực cao";
  };

  // Get air quality CSS class based on AQI value
  const getAirQualityClass = (aqi) => {
    switch (aqi) {
      case 1: return "good";
      case 2: return "fair";
      case 3: return "moderate";
      case 4: return "poor";
      case 5: return "very-poor";
      default: return "";
    }
  };

  // Get air quality badge color and text based on AQI
  const getAirQualityBadge = (aqi, airQuality) => {
    switch (aqi) {
      case 1:
        return { color: "#4ade80", text: "TỐT" }; // Green - Good
      case 2:
        return { color: "#fbbf24", text: "KHẤP" }; // Yellow - Fair
      case 3:
        return { color: "#f97316", text: "TB" }; // Orange - Moderate
      case 4:
        return { color: "#ef4444", text: "KÉM" }; // Red - Poor
      case 5:
        return { color: "#7c2d12", text: "XẤU" }; // Dark red - Very poor
      default:
        return { color: "#4ade80", text: "TỐT" };
    }
  };

  // Get weather type for styling
  const getWeatherType = (condition) => {
    if (condition?.includes("quang") || condition?.includes("nắng") || condition?.includes("Trời quang")) {
      return "sunny";
    }
    if (condition?.includes("mưa") || condition?.includes("phùn")) {
      return "rainy";
    }
    if (condition?.includes("mây") || condition?.includes("u ám") || condition?.includes("U ám")) {
      return "cloudy";
    }
    if (condition?.includes("dông") || condition?.includes("sấm")) {
      return "stormy";
    }
    return "default";
  };

  // Render loading state
  if (isLoading && !weatherData) {
    return React.createElement("div", {
      className: \`weather-panel unified loading \${className}\`,
      style: {
        flex: 1,
        width: "100%",
        backgroundColor: "transparent",
        backgroundImage: "url(assets/imgs/research.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "16px",
        border: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        position: "relative"
      }
    }, [
      React.createElement("div", {
        key: "overlay",
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(30, 58, 95, 0.85) 0%, rgba(44, 82, 130, 0.75) 50%, rgba(26, 54, 93, 0.85) 100%)",
          zIndex: 1
        }
      }),
      React.createElement("div", { 
        key: "title", 
        style: { 
          fontSize: "16px", 
          fontWeight: "bold",
          marginBottom: "8px",
          zIndex: 2,
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
        } 
      }, "TP. THỪA THIÊN HUẾ"),
      React.createElement("div", { 
        key: "loading", 
        style: { 
          fontSize: "12px",
          zIndex: 2,
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
        } 
      }, "Đang tải...")
    ]);
  }

  // Render error state
  if (!weatherData && connectionStatus === "error") {
    return React.createElement("div", {
      className: \`weather-panel unified error \${className}\`,
      style: {
        flex: 1,
        width: "100%",
        backgroundColor: "transparent",
        backgroundImage: "url(assets/imgs/research.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "16px",
        border: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        position: "relative"
      }
    }, [
      React.createElement("div", {
        key: "overlay",
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(30, 58, 95, 0.85) 0%, rgba(44, 82, 130, 0.75) 50%, rgba(26, 54, 93, 0.85) 100%)",
          zIndex: 1
        }
      }),
      React.createElement("div", { 
        key: "title", 
        style: { 
          fontSize: "16px", 
          fontWeight: "bold",
          marginBottom: "8px",
          zIndex: 2,
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
        } 
      }, "TP. THỪA THIÊN HUẾ"),
      React.createElement("div", { 
        key: "error", 
        style: { 
          fontSize: "12px", 
          color: "#ff6b6b",
          marginBottom: "8px",
          zIndex: 2,
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
        } 
      }, "Lỗi kết nối"),
      React.createElement("button", { 
        key: "retry", 
        onClick: handleRefresh,
        style: { 
          marginTop: "5px", 
          padding: "4px 8px", 
          fontSize: "10px",
          background: "#ff6b6b",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: "pointer",
          zIndex: 2
        }
      }, "Thử lại")
    ]);
  }

  if (!weatherData) {
    return null;
  }

  const weatherType = getWeatherType(weatherData.weatherCondition);

  return React.createElement("div", {
    className: \`weather-panel unified \${weatherType} \${className}\`,
    onClick: handleRefresh,
    style: {
      flex: 1,
      width: "100%",
      backgroundColor: "transparent",
      backgroundImage: "url(assets/imgs/research.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: "16px",
      border: "none",
      display: "flex",
      flexDirection: "column",
      cursor: "pointer",
      color: "white",
      position: "relative",
      overflow: "hidden"
    }
  }, [
    // Background overlay for better readability
    React.createElement("div", {
      key: "overlay",
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, rgba(30, 58, 95, 0.85) 0%, rgba(44, 82, 130, 0.75) 50%, rgba(26, 54, 93, 0.85) 100%)",
        zIndex: 1
      }
    }),
    // Header with city name
    React.createElement("div", { 
      key: "title",
      style: { 
        fontSize: "16px", 
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: "12px", 
        background: "rgba(0, 0, 0, 0.3)",
        padding: "8px 12px",
        position: "relative",
        zIndex: 2,
        textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)"
      }
    }, [
      React.createElement("span", { key: "city" }, weatherData.cityName),
      React.createElement("div", { 
        key: "indicator",
        style: {
          position: "absolute",
          top: "8px",
          right: "12px",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: connectionStatus === "connected" ? "#00ff00" : "#ff0000",
          zIndex: 3
        }
      })
    ]),

    // Unified content container
    React.createElement("div", { 
      key: "unified-content",
      style: { 
        flex: 1,
        padding: "0",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        zIndex: 2
      }
    }, [
      // Main content - two column layout like in the image
      React.createElement("div", { 
        key: "main-content",
        style: { 
          display: "flex", 
          flex: 1,
          width: "100%"
        }
      }, [
        // Left column - Weather info (like in image)
        React.createElement("div", { 
          key: "weather-left",
          style: { 
            flex: 1,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between"
          }
        }, [
          // Weather icon and main temperature
          React.createElement("div", { 
            key: "temp-main-container",
            style: { 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "8px", 
              marginBottom: "4px" 
            }
          }, [
            React.createElement("div", {
              key: "weather-icon",
              style: { 
                width: "60px", 
                height: "60px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5)) sepia(100%) saturate(200%) hue-rotate(30deg) brightness(1.3)",
                color: "#FFD700",
                flexShrink: 0
              },
              dangerouslySetInnerHTML: { 
                __html: getWeatherIcon(weatherData.weatherCode, weatherData.weatherCondition) 
              }
            }),
            React.createElement("div", { 
              key: "temp-main",
              style: { 
                fontSize: "48px", 
                fontWeight: "bold", 
                color: "#ffffff",
                textShadow: "0 3px 6px rgba(0, 0, 0, 0.8)",
                lineHeight: 1
              }
            }, \`\${weatherData.temperature}°\`)
          ]),

          // Feels like temperature
          React.createElement("div", { 
            key: "temp-feels",
            style: { 
              fontSize: "18px", 
              color: "#ffffff",
              opacity: 0.9,
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
              marginBottom: "12px"
            }
          }, \`- \${weatherData.feelsLike}°\`),

          // Weather details grid beneath temperature
          React.createElement("div", { 
            key: "weather-details-grid",
            style: { 
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              marginBottom: "12px"
            }
          }, [
            React.createElement("div", { 
              key: "humidity",
              style: { 
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.35)",
                padding: "8px",
                borderRadius: "6px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "14px", 
                  color: "#ffffff", 
                  opacity: 0.9,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)"
                }
              }, "Độ ẩm"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)"
                }
              }, weatherData.humidity + '%')
            ]),
            React.createElement("div", { 
              key: "rain",
              style: { 
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.35)",
                padding: "8px",
                borderRadius: "6px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "14px", 
                  color: "#ffffff", 
                  opacity: 0.9,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)"
                }
              }, "Mưa"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)"
                }
              }, weatherData.rainProbability + '%')
            ]),
            React.createElement("div", { 
              key: "uv",
              style: { 
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.35)",
                padding: "8px",
                borderRadius: "6px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "14px", 
                  color: "#ffffff", 
                  opacity: 0.9,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)"
                }
              }, "UV"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)"
                }
              }, getUVLevel(weatherData.uvIndex))
            ]),
            React.createElement("div", { 
              key: "wind",
              style: { 
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.35)",
                padding: "8px",
                borderRadius: "6px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "14px", 
                  color: "#ffffff", 
                  opacity: 0.9,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)"
                }
              }, "Gió"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)"
                }
              }, weatherData.windSpeed + ' km/h')
            ])
          ]),

          // Air quality status (bottom of left column)
          React.createElement("div", { 
            key: "air-quality-status",
            style: { 
              fontSize: "12px", 
              color: "#ffffff", 
              textAlign: "center", 
              opacity: 0.9,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)"
            }
          }, \`Chất lượng không khí: \${weatherData.airQuality}\`)
        ]),

        // Right column - Device measurements (like in image)
        React.createElement("div", { 
          key: "weather-right",
          style: { 
            flex: "0 0 140px",
            background: "rgba(255, 255, 255, 0.2)",
            padding: "12px",
            display: "flex",
            flexDirection: "column"
          }
        }, [
          React.createElement("div", { 
            key: "device-title",
            style: { 
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ffffff",
              textAlign: "center",
              marginBottom: "16px",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
              letterSpacing: "1px"
            }
          }, "THIẾT BỊ ĐO"),

          React.createElement("div", { 
            key: "device-temp",
            style: { 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }
          }, [
            React.createElement("span", { 
              key: "label",
              style: { fontSize: "14px", color: "#ffffff", opacity: 0.9 }
            }, "Nhiệt độ"),
            React.createElement("span", { 
              key: "value",
              style: { 
                fontSize: "16px", 
                fontWeight: "bold", 
                color: "#ffffff", 
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
              }
            }, \`\${weatherData.temperature}°\`)
          ]),

          React.createElement("div", { 
            key: "device-humidity",
            style: { 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }
          }, [
            React.createElement("span", { 
              key: "label",
              style: { fontSize: "14px", color: "#ffffff", opacity: 0.9 }
            }, "Độ ẩm"),
            React.createElement("span", { 
              key: "value",
              style: { 
                fontSize: "16px", 
                fontWeight: "bold", 
                color: "#ffffff", 
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
              }
            }, \`\${weatherData.humidity}%\`)
          ]),

          React.createElement("div", { 
            key: "device-pm25",
            style: { 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }
          }, [
            React.createElement("span", { 
              key: "label",
              style: { fontSize: "14px", color: "#ffffff", opacity: 0.9 }
            }, "PM2.5"),
            React.createElement("span", { 
              key: "value",
              style: { 
                fontSize: "16px", 
                fontWeight: "bold", 
                color: "#ffffff", 
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
              }
            }, [
              "2,06",
              React.createElement("span", { 
                key: "unit",
                style: { fontSize: "10px", fontWeight: "normal", opacity: 0.8, marginLeft: "2px" }
              }, "μg/m³")
            ])
          ]),

          React.createElement("div", { 
            key: "device-pm10",
            style: { 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }
          }, [
            React.createElement("span", { 
              key: "label",
              style: { fontSize: "14px", color: "#ffffff", opacity: 0.9 }
            }, "PM10"),
            React.createElement("span", { 
              key: "value",
              style: { 
                fontSize: "16px", 
                fontWeight: "bold", 
                color: "#ffffff", 
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
              }
            }, [
              "2,4",
              React.createElement("span", { 
                key: "unit",
                style: { fontSize: "10px", fontWeight: "normal", opacity: 0.8, marginLeft: "2px" }
              }, "μg/m³")
            ])
          ]),

          React.createElement("div", { 
            key: "air-quality-badge",
            style: { 
              background: "#4ade80",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "bold",
              textAlign: "center",
              padding: "6px 12px",
              borderRadius: "6px",
              marginTop: "auto",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
              boxShadow: "0 2px 4px rgba(74, 222, 128, 0.3)"
            }
          }, "TỐT")
        ])
      ]),



          ]),

    // Weather Alert Banner
    React.createElement("div", { 
      key: "alert",
      style: { 
        display: (weatherData.rainProbability > 70 || weatherData.weatherCondition.includes("mưa to") || weatherData.weatherCondition.includes("dông")) ? "flex" : "none",
        position: "absolute",
        bottom: "0px",
        left: 0,
        right: 0,
        background: "linear-gradient(135deg, #dc2626, #b91c1c)",
        color: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "12px 16px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "1px",
        boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
        zIndex: 3
      }
    }, [
      React.createElement("div", {
        key: "alert-icon",
        style: {
          background: "#fbbf24",
          color: "#dc2626",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "bold",
          flexShrink: 0
        }
      }, "!"),
      React.createElement("div", {
        key: "alert-text",
        style: {
          fontSize: "16px",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
          flex: 1,
          textAlign: "center"
        }
      }, "CẢNH BÁO MƯA LỚN")
    ]),

    // Loading overlay for refresh
    React.createElement("div", { 
      key: "loading-overlay",
      style: {
        display: isLoading ? "flex" : "none",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10
      }
    }, React.createElement("div", {
      key: "refresh-spinner",
      style: {
        width: "16px",
        height: "16px",
        border: "2px solid #333",
        borderTop: "2px solid #ffffff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }
    }))
  ]);
}

// IoTPanel removed - integrated into unified WeatherPanel

// CompanyLogo Component (functional version with hooks)
function CompanyLogo() {
  const [config, setConfig] = useState(null);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    loadConfig();
    
    if (window.electronAPI && window.electronAPI.onConfigUpdated) {
      window.electronAPI.onConfigUpdated((event, newConfig) => {
        console.log("Config updated:", newConfig);
        setConfig(newConfig);
      });
    }
    
    return () => {
      if (window.electronAPI && window.electronAPI.removeConfigListener) {
        window.electronAPI.removeConfigListener();
      }
    };
  }, []);

  useEffect(() => {
    startLogoRotation();
  }, [config]);

  const loadConfig = async () => {
    try {
      if (window.electronAPI) {
        const loadedConfig = await window.electronAPI.getConfig();
        setConfig(loadedConfig);
      } else {
        setConfig({
          logoMode: "fixed",
          logoImages: [],
          logoLoopDuration: 5,
        });
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const startLogoRotation = () => {
    if (config && config.logoMode === "loop" && config.logoImages && config.logoImages.length > 1) {
      const duration = (config.logoLoopDuration || 5) * 1000;
      
      const interval = setInterval(() => {
        setCurrentLogoIndex(prev => (prev + 1) % config.logoImages.length);
      }, duration);
      
      return () => clearInterval(interval);
    }
  };

  const getCurrentLogo = () => {
    if (!config || !config.logoImages || config.logoImages.length === 0) {
      return null;
    }

    switch (config.logoMode) {
      case "fixed":
        return config.logoImages[0];
      case "loop":
        return config.logoImages[currentLogoIndex % config.logoImages.length];
      case "scheduled":
        return getScheduledLogo();
      default:
        return config.logoImages[0];
    }
  };

  const getScheduledLogo = () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");

    const matchingSchedule = config.schedules?.find(schedule => schedule.time === currentTime);

    if (matchingSchedule && config.logoImages[matchingSchedule.logoIndex]) {
      return config.logoImages[matchingSchedule.logoIndex];
    }

    return config.logoImages[0];
  };

  const renderCustomLogo = (logo) => {
    return React.createElement("img", {
      src: \`file://\${logo.path}\`,
      alt: logo.name,
      style: {
        maxWidth: "100%",
        maxHeight: "80px",
        objectFit: "contain",
        borderRadius: "4px",
      },
      onError: (e) => {
        console.error("Failed to load logo:", logo.path);
        e.target.style.display = "none";
      },
    });
  };

  const renderDefaultLogo = () => {
    return [
      React.createElement("div", {
        key: "logo-circle",
        style: {
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "12px",
          fontSize: "36px",
          fontWeight: "bold",
          color: "#ff6b35",
          cursor: "pointer",
        },
      }, "C"),
      React.createElement("div", {
        key: "text-container",
        style: {
          display: "flex",
          flexDirection: "column",
          color: "white",
        },
      }, [
        React.createElement("div", {
          key: "title",
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            lineHeight: "1.2",
            margin: 0,
          },
        }, "CÔNG TY"),
        React.createElement("div", {
          key: "subtitle",
          style: {
            fontSize: "12px",
            lineHeight: "1.2",
            margin: 0,
            opacity: 0.9,
          },
        }, "VÌ CUỘC SỐNG TỐT ĐẸP HƠN")
      ])
    ];
  };

  const currentLogo = getCurrentLogo();

  return React.createElement("div", {
    style: {
      flex: 1,
      backgroundColor: "#ff6b35",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
      position: "relative",
      overflow: "hidden",
    }
  }, currentLogo ? renderCustomLogo(currentLogo) : renderDefaultLogo());
}

// E-Ra IoT Service Integration
class EraIotService {
  constructor(config) {
    this.config = config;
    this.currentData = null;
    this.updateTimer = null;
    this.isUpdating = false;
    console.log("EraIotService: Initialized with config", {
      baseUrl: this.config.baseUrl,
      hasAuthToken: !!this.config.authToken,
      sensorConfigs: this.config.sensorConfigs,
    });
  }

  async startPeriodicUpdates() {
    if (this.updateTimer) {
      this.stopPeriodicUpdates();
    }

    // Initial fetch
    await this.fetchSensorData();

    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.fetchSensorData();
    }, this.config.updateInterval * 60 * 1000);

    console.log(\`EraIotService: Started periodic updates every \${this.config.updateInterval} minutes\`);
  }

  stopPeriodicUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log("EraIotService: Stopped periodic updates");
    }
  }

  async fetchSensorData() {
    if (this.isUpdating) {
      console.log("EraIotService: Update already in progress, skipping");
      return;
    }

    this.isUpdating = true;
    console.log("EraIotService: Starting sensor data fetch");

    try {
      const sensorPromises = [
        this.fetchSensorValue(this.config.sensorConfigs.temperature, "temperature"),
        this.fetchSensorValue(this.config.sensorConfigs.humidity, "humidity"),
        this.fetchSensorValue(this.config.sensorConfigs.pm25, "pm25"),
        this.fetchSensorValue(this.config.sensorConfigs.pm10, "pm10"),
      ];

      const results = await Promise.allSettled(sensorPromises);
      
      const sensorData = {
        temperature: null,
        humidity: null,
        pm25: null,
        pm10: null,
        lastUpdated: new Date(),
      };

      let successCount = 0;
      const sensorNames = ["temperature", "humidity", "pm25", "pm10"];
      
      results.forEach((result, index) => {
        const sensorName = sensorNames[index];
        
        if (result.status === "fulfilled" && result.value !== null) {
          sensorData[sensorName] = result.value;
          successCount++;
          console.log(\`EraIotService: \${sensorName} = \${result.value}\`);
        } else {
          console.error(\`EraIotService: Failed to fetch \${sensorName}:\`, result.reason || "No data");
        }
      });

      // Determine overall status
      let status;
      if (successCount === 4) {
        status = "success";
      } else if (successCount > 0) {
        status = "partial";
      } else {
        status = "error";
      }

      this.currentData = {
        ...sensorData,
        status,
        errorMessage: status === "error" ? "Connection failed" : undefined,
      };

      console.log("EraIotService: Data update completed", {
        status,
        successCount: \`\${successCount}/4\`,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        pm25: sensorData.pm25,
        pm10: sensorData.pm10,
      });
    } catch (error) {
      console.error("EraIotService: Critical error during sensor fetch:", error);
      this.useFallbackData(error);
    } finally {
      this.isUpdating = false;
    }
  }

  async fetchSensorValue(configId, sensorName) {
    try {
      console.log(\`EraIotService: Fetching \${sensorName} (config ID: \${configId})\`);

      const response = await fetch(\`\${this.config.baseUrl}/api/chip_manager/configs/\${configId}/current_value/\`, {
        method: 'GET',
        headers: {
          'Authorization': this.config.authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ITS-Billboard-EraIoT/1.0',
        },
        timeout: this.config.timeout,
      });

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}\`);
      }

      const data = await response.json();
      console.log(\`EraIotService: Raw API response for \${sensorName}:\`, data);

      return this.extractValue(data);
    } catch (error) {
      console.error(\`EraIotService: Error fetching \${sensorName}:\`, error);
      throw error;
    }
  }

  extractValue(data) {
    if (typeof data === "number") return data;
    if (data?.current_value_only && typeof data.current_value_only === "number") return data.current_value_only;
    if (data?.current_value && typeof data.current_value === "number") return data.current_value;
    if (data?.value && typeof data.value === "number") return data.value;
    if (Array.isArray(data) && data[0]?.current_value_only) return data[0].current_value_only;
    if (Array.isArray(data) && data[0]?.current_value) return data[0].current_value;
    if (Array.isArray(data) && data[0]?.value) return data[0].value;
    return null;
  }

  useFallbackData(error) {
    this.currentData = {
      temperature: null,
      humidity: null,
      pm25: 15.0,
      pm10: 25.0,
      lastUpdated: new Date(),
      status: "error",
      errorMessage: \`Connection failed: \${error.message || "Unknown error"}\`,
    };
    console.log("EraIotService: Using fallback sensor data");
  }

  getCurrentData() {
    return this.currentData;
  }

  async refreshData() {
    console.log("EraIotService: Manual refresh requested");
    await this.fetchSensorData();
  }

  destroy() {
    this.stopPeriodicUpdates();
    this.currentData = null;
    console.log("EraIotService: Destroyed");
  }
}

// IoT Panel Component
function IoTPanel({ eraIotService, className = "" }) {
  const [sensorData, setSensorData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [connectionStatus, setConnectionStatus] = React.useState("offline");

  React.useEffect(() => {
    if (!eraIotService) {
      console.log("IoTPanel: No E-Ra IoT service provided");
      setIsLoading(false);
      setConnectionStatus("offline");
      return;
    }

    console.log("IoTPanel: Initializing with E-Ra IoT service");

    const pollInterval = setInterval(() => {
      const data = eraIotService.getCurrentData();
      if (data) {
        console.log("IoTPanel: Received sensor data:", data);
        setSensorData(data);
        setIsLoading(false);
        setConnectionStatus(data.status === "error" ? "error" : "connected");
      }
    }, 3000);

    const initialData = eraIotService.getCurrentData();
    if (initialData) {
      setSensorData(initialData);
      setIsLoading(false);
      setConnectionStatus(initialData.status === "error" ? "error" : "connected");
    }

    return () => {
      clearInterval(pollInterval);
    };
  }, [eraIotService]);

  const getSensorStatus = (value, type) => {
    if (value === null) return "offline";
    
    switch (type) {
      case "temperature":
        if (value >= 15 && value <= 35) return "good";
        if (value >= 10 && value <= 40) return "warning";
        return "error";
      case "humidity":
        if (value >= 30 && value <= 70) return "good";
        if (value >= 20 && value <= 80) return "warning";
        return "error";
      case "pm25":
        if (value <= 12) return "good";
        if (value <= 35) return "warning";
        return "error";
      case "pm10":
        if (value <= 20) return "good";
        if (value <= 50) return "warning";
        return "error";
      default:
        return "good";
    }
  };

  const formatSensorData = (data) => {
    return [
      {
        label: "Nhiệt độ",
        value: data.temperature !== null ? \`\${data.temperature.toFixed(1)}\` : "--",
        unit: "°C",
        status: getSensorStatus(data.temperature, "temperature"),
        icon: "🌡️",
      },
      {
        label: "Độ ẩm",
        value: data.humidity !== null ? \`\${data.humidity.toFixed(1)}\` : "--",
        unit: "%",
        status: getSensorStatus(data.humidity, "humidity"),
        icon: "💧",
      },
      {
        label: "PM2.5",
        value: data.pm25 !== null ? \`\${data.pm25.toFixed(1)}\` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm25, "pm25"),
        icon: "🌫️",
      },
      {
        label: "PM10",
        value: data.pm10 !== null ? \`\${data.pm10.toFixed(1)}\` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm10, "pm10"),
        icon: "💨",
      },
    ];
  };

  if (isLoading && !sensorData) {
    return React.createElement("div", {
      style: {
        width: "192px",
        height: "288px",
<<<<<<< HEAD
        backgroundColor: "#1a237e",
=======
>>>>>>> fix/label-size
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "14px",
        padding: "8px",
        boxSizing: "border-box",
      }
    }, [
      React.createElement("div", { key: "title", style: { fontSize: "14px", fontWeight: "bold", marginBottom: "8px" } }, "THIẾT BỊ ĐO"),
      React.createElement("div", { key: "loading", style: { fontSize: "10px", color: "#888" } }, "Đang kết nối...")
    ]);
  }

  if (!eraIotService || (!sensorData && connectionStatus === "error")) {
    return React.createElement("div", {
      style: {
        width: "192px",
        height: "288px",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "14px",
        padding: "8px",
        boxSizing: "border-box",
      }
    }, [
      React.createElement("div", { key: "title", style: { fontSize: "14px", fontWeight: "bold", marginBottom: "8px" } }, "THIẾT BỊ ĐO"),
      React.createElement("div", { key: "error", style: { fontSize: "10px", color: "#ff4444" } }, !eraIotService ? "Chưa cấu hình" : "Lỗi kết nối")
    ]);
  }

  if (!sensorData) {
    return React.createElement("div", {
      style: {
        width: "192px",
        height: "288px",
    
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "14px",
        padding: "8px",
        boxSizing: "border-box",
      }
    }, [
      React.createElement("div", { key: "title", style: { fontSize: "14px", fontWeight: "bold", marginBottom: "8px" } }, "THIẾT BỊ ĐO"),
      React.createElement("div", { key: "offline", style: { fontSize: "10px", color: "#888" } }, "Không có dữ liệu")
    ]);
  }

  const sensors = formatSensorData(sensorData);

  return React.createElement("div", {
    className: "iot-panel " + className,
    style: {
      width: "192px",
      height: "288px",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "8px",
      boxSizing: "border-box",
      fontSize: "14px",
      backgroundImage: "url('assets/imgs/research.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
    }
  }, [
    // Background overlay for better text readability
    React.createElement("div", {
      key: "overlay",
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
     
        zIndex: 1
      }
    }),
    // Header
    React.createElement("div", {
      key: "header",
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
        paddingBottom: "4px",
        borderBottom: "1px solid #333",
        position: "relative",
        zIndex: 2,
      }
    }, [
      React.createElement("div", { key: "title", style: { fontSize: "12px", fontWeight: "bold" } }, "THIẾT BỊ ĐO"),
      React.createElement("div", {
        key: "status",
        style: {
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: connectionStatus === "connected" ? "#4CAF50" : connectionStatus === "error" ? "#f44336" : "#888",
        }
      })
    ]),

    // Sensors
    ...sensors.map((sensor, index) => 
      React.createElement("div", {
        key: index,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 0",
          borderBottom: index < sensors.length - 1 ? "1px solid #333" : "none",
          position: "relative",
          zIndex: 2,
          }
      }, [
        React.createElement("div", {
          key: "info",
          style: { display: "flex", alignItems: "center", flex: 1 }
        }, [
          React.createElement("span", { key: "icon", style: { marginRight: "4px", fontSize: "14px" } }, sensor.icon),
          React.createElement("span", { key: "label", style: { fontSize: "14px" } }, sensor.label)
        ]),
        React.createElement("div", {
          key: "value",
          style: { 
            display: "flex", 
            alignItems: "center", 
            color: sensor.status === "good" ? "#4CAF50" : sensor.status === "warning" ? "#FF9800" : "#f44336"
          }
        }, [
          React.createElement("span", { key: "val", style: { fontWeight: "bold", marginRight: "2px" } }, sensor.value),
          React.createElement("span", { key: "unit", style: { fontSize: "8px" } }, sensor.unit)
        ])
      ])
    ),

    // Footer
    React.createElement("div", {
      key: "footer",
      style: {
        marginTop: "auto",
        paddingTop: "4px",
        borderTop: "1px solid #333",
        fontSize: "8px",
        color: "#888",
        textAlign: "center",
        position: "relative",
        zIndex: 2,
      }
    }, sensorData ? \`\${sensorData.lastUpdated.toLocaleTimeString("vi-VN")}\` : "")
  ]);
}

// Updated BillboardLayout with E-Ra IoT integration
function BillboardLayout() {
  const [eraIotService, setEraIotService] = React.useState(null);

  console.log("BillboardLayout: Component initialized");

  React.useEffect(() => {
    console.log("BillboardLayout: useEffect triggered");
    
    const initializeEraIot = async () => {
      try {
        console.log("BillboardLayout: Loading E-Ra IoT configuration...");
        
        if (typeof window !== "undefined" && window.electronAPI) {
          console.log("BillboardLayout: electronAPI available, fetching config...");
          
          const config = await window.electronAPI.getConfig();
          console.log("BillboardLayout: Raw config received:", {
            hasEraIot: !!config?.eraIot,
            enabled: config?.eraIot?.enabled,
            hasAuthToken: !!config?.eraIot?.authToken,
          });
          
          if (config?.eraIot?.authToken) {
            console.log("BillboardLayout: Initializing E-Ra IoT service");
            
            const eraConfig = {
              authToken: config.eraIot.authToken,
              baseUrl: config.eraIot.baseUrl || "https://backend.eoh.io",
              sensorConfigs: config.eraIot.sensorConfigs || {
                temperature: 138997,
                humidity: 138998,
                pm25: 138999,
                pm10: 139000,
              },
              updateInterval: config.eraIot.updateInterval || 5,
              timeout: config.eraIot.timeout || 15000,
              retryAttempts: config.eraIot.retryAttempts || 3,
              retryDelay: config.eraIot.retryDelay || 2000,
            };

            const service = new EraIotService(eraConfig);
            await service.startPeriodicUpdates();
            setEraIotService(service);
          } else {
            console.log("BillboardLayout: No valid E-Ra IoT AUTHTOKEN found");
          }
        } else {
          console.log("BillboardLayout: electronAPI not available");
        }
      } catch (error) {
        console.error("BillboardLayout: Failed to initialize E-Ra IoT service:", error);
      }
    };

    initializeEraIot();

    return () => {
      if (eraIotService) {
        eraIotService.destroy();
      }
    };
  }, []);

  return React.createElement("div", {
    style: {
      width: "384px",
      height: "384px",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Arial, sans-serif",
      margin: 0,
      padding: 0,
    }
  }, [
    React.createElement("div", {
      key: "top-row",
      style: {
        flex: 3,
        display: "flex",
        width: "100%",
      }
    }, [
      React.createElement(WeatherPanel, { key: "weather", className: "unified-weather" }),
      React.createElement(IoTPanel, { key: "iot", eraIotService: eraIotService, className: "unified" })
    ]),
    React.createElement(CompanyLogo, { key: "logo" })
  ]);
}

// Main App Component
function App() {
  return React.createElement("div", {
    style: {
      width: "384px",
      height: "384px",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      fontFamily: "Arial, sans-serif",
    }
  }, React.createElement(BillboardLayout));
}

// Initialize React App
document.addEventListener("DOMContentLoaded", () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(App));
  
  console.log("Billboard React App initialized with REAL WEATHER API integration");
  console.log("WeatherPanel now uses consistent data from GlobalWeatherServiceManager");
});
`;

// Write the bundled file
const outputPath = path.join(__dirname, "renderer", "app-built.js");
fs.writeFileSync(outputPath, bundleContent.trim());

console.log("Renderer components built successfully!");
console.log("Real weather API integration enabled");
console.log("Data consistency issues resolved");
console.log("Output: renderer/app-built.js");
