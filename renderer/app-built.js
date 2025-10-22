// app-built.js - Generated bundle from TypeScript components
// This replaces the old app.js with real API integration

// Import React from CDN (already loaded in HTML)
const { useState, useEffect } = React;

// Weather Icons System - Using Custom Image Files
const WeatherIcons = {
  CLEAR_DAY: "../assets/imgs/sun.png",
  PARTLY_CLOUDY: "../assets/imgs/weather.png",
  CLOUDY: "../assets/imgs/weather.png",
  RAINY: "../assets/imgs/storm.png",
  HEAVY_RAIN: "../assets/imgs/storm.png",
  THUNDERSTORM: "../assets/imgs/storm.png",
  SNOW: "../assets/imgs/weather.png",
  FOG: "../assets/imgs/weather.png",
  WIND: "../assets/imgs/wind.png",
  DEFAULT: "../assets/imgs/weather.png",
};

function getWeatherIcon(weatherCode, condition) {
  // Clear sky conditions
  if (weatherCode === 0 || weatherCode === 1 || condition.includes("quang") || condition.includes("nắng")) {
    return WeatherIcons.CLEAR_DAY;
  }
  
  // Partly cloudy conditions  
  if (weatherCode === 2 || weatherCode === 3 || condition.includes("mây") || condition.includes("u ám")) {
    return WeatherIcons.PARTLY_CLOUDY;
  }
  
  // Overcast/cloudy conditions
  if (condition.includes("âm u") || condition.includes("nhiều mây")) {
    return WeatherIcons.CLOUDY;
  }
  
  // Rain conditions - expanded to include all rain codes (51-65: drizzle/rain, 80-82: rain showers)
  if ((weatherCode >= 51 && weatherCode <= 65) || // Drizzle and rain
      (weatherCode >= 80 && weatherCode <= 82) || // Rain showers  
      condition.includes("mưa") || condition.includes("phùn")) {
    return WeatherIcons.RAINY;
  }
  
  // Thunderstorm conditions - use RAINY icon as fallback
  if ((weatherCode >= 95 && weatherCode <= 99) || condition.includes("dông")) {
    return WeatherIcons.RAINY;
  }
  
  // Snow conditions - use CLOUDY icon as fallback
  if ((weatherCode >= 71 && weatherCode <= 75) || condition.includes("tuyết")) {
    return WeatherIcons.CLOUDY;
  }
  
  // Fog conditions - use CLOUDY icon as fallback
  if (weatherCode === 45 || weatherCode === 48 || condition.includes("sương")) {
    return WeatherIcons.CLOUDY;
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
    console.log(`WeatherService: Updates every ${this.config.updateInterval} minutes`);
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
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,uv_index,apparent_temperature,precipitation_probability,visibility&timezone=Asia/Ho_Chi_Minh&forecast_days=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ITS-Billboard/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    console.error(`WeatherService: Failed (${this.retryCount}/${this.config.maxRetries})`);

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
      56: "Mưa phùn đóng băng nhẹ",
      57: "Mưa phùn đóng băng dày đặc",
      61: "Mưa nhẹ",
      63: "Mưa vừa", 
      65: "Mưa to",
      66: "Mưa đóng băng nhẹ",
      67: "Mưa đóng băng to",
      71: "Tuyết rơi nhẹ",
      73: "Tuyết rơi vừa",
      75: "Tuyết rơi to",
      77: "Hạt tuyết",
      80: "Mưa rào nhẹ",
      81: "Mưa rào vừa", 
      82: "Mưa rào to",
      85: "Tuyết rào nhẹ",
      86: "Tuyết rào to",
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
        console.log(`WeatherPanel: Data is fresh (${Math.round(dataAge/60000)}min old), no refresh needed`);
        
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
      className: `weather-panel unified loading ${className}`,
      style: {
        flex: "1",
        width: "100%",
        background: "linear-gradient(135deg, #142A3F 0%, #1e3a5f 50%, #1e3a5f 100%)",
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
          background: "transparent",
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
      className: `weather-panel unified error ${className}`,
      style: {
        flex: "1",
        width: "100%",
        background: "linear-gradient(135deg, #142A3F 0%, #1e3a5f 50%, #1e3a5f 100%)",
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
          background: "transparent",
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
    className: `weather-panel unified ${weatherType} ${className}`,
    onClick: handleRefresh,
    style: {
      flex: "1",
      background: "linear-gradient(135deg, #142A3F 0%, #1e3a5f 50%, #1e3a5f 100%)",
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
        background: "transparent",
        zIndex: 1
      }
    }),
    // Header with city name
    React.createElement("div", { 
      key: "title",
      style: { 
        fontSize: "16px", 
        fontWeight: "bold",
        textAlign: "left", // Changed from center to left to align with IoT panel
        marginBottom: "0px", // Removed margin to move higher
        padding: "2px 6px", // Reduced right padding to align with IoT panel
        position: "relative",
        zIndex: 2,
        textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
         marginRight:"50px",
      }
    }, [
      React.createElement("span", { key: "city" }, weatherData.cityName)
    ]),

    // Unified content container
    React.createElement("div", { 
      key: "unified-content",
      style: { 
        flex: 1,
        padding: "0",
        display: "flex",
        flexDirection: "column",
        gap: "4px", // Further reduced gap to move content up more
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
            padding: "4px 0", // Removed right padding
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
              marginBottom: "0px" // Reduced from 4px to move content up
            }
          }, [
            React.createElement("img", {
              key: "weather-icon",
              src: getWeatherIcon(weatherData.weatherCode, weatherData.weatherCondition),
              alt: "Weather Icon",
              style: { 
                width: "60px", 
                height: "60px", 
                objectFit: "contain",
                filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))",
                flexShrink: 0
              },
              onError: (e) => {
                console.error("Failed to load weather icon:", e.target.src);
                e.target.style.display = "none";
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
            }, `${weatherData.temperature}°`)
          ]),

          // Weather details 2x2 grid - Hàng 1: Độ ẩm và UV, Hàng 2: Mưa và Gió
          React.createElement("div", { 
            key: "weather-details-grid",
            style: { 
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr", // 2 columns
              gridTemplateRows: "1fr 1fr", // 2 rows
              gap: "4px", // Consistent gap between all items
              marginBottom: "2px", // Minimal margin
              marginTop: "-8px", // Negative margin to bring elements directly close to main temperature
              paddingLeft: "0px", // Remove left padding to shift more left
              paddingRight: "8px"
            }
          }, [
            // First row, first column: Độ ẩm
            React.createElement("div", { 
              key: "humidity",
              style: { 
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "6px 4px",    
                borderRadius: "3px",
                minHeight: "35px"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "12px",
                  color: "#ffffffff", 
                  opacity: 1,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                  marginBottom: "0px",
                  marginRight: "8px",
                  fontWeight: "600",
                  letterSpacing: "0.2px",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap"
                }
              }, "Độ ẩm"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "14px",
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap"
                }
              }, weatherData.humidity + '%')
            ]),
            // First row, second column: UV
            React.createElement("div", { 
              key: "uv",
              style: { 
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "6px 4px",
                borderRadius: "3px",
                minHeight: "35px"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "12px",
                  color: "#ffffffff",
                  opacity: 1,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                  marginBottom: "0px",
                  marginRight: "8px",
                  fontWeight: "600",
                  letterSpacing: "0.2px",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap"
                }
              }, "UV"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "14px",
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap"
                }
              }, getUVLevel(weatherData.uvIndex))
            ]),
            // Second row, first column: Mưa
            React.createElement("div", { 
              key: "rain",
              style: { 
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "6px 4px",
                borderRadius: "3px",
                minHeight: "35px"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "12px",
                  color: "#ffffffff",
                  opacity: 1,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                  marginBottom: "0px",
                  marginRight: "8px",
                  fontWeight: "600",
                  letterSpacing: "0.2px",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap"
                }
              }, "Mưa"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "14px",
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap"
                }
              }, weatherData.rainProbability + '%')
            ]),
            // Second row, second column: Gió
            React.createElement("div", { 
              key: "wind",
              style: { 
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "6px 4px",
                borderRadius: "3px",
                minHeight: "35px"
              }
            }, [
              React.createElement("div", { 
                key: "label",
                style: { 
                  fontSize: "12px",
                  color: "#ffffffff",
                  opacity: 1,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                  marginBottom: "0px",
                  marginRight: "8px",
                  fontWeight: "600",
                  letterSpacing: "0.2px",
                  textTransform: "capitalize",
                  whiteSpace: "nowrap"
                }
              }, "Gió"),
              React.createElement("div", { 
                key: "value",
                style: { 
                  fontSize: "14px",
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap"
                }
              }, weatherData.windSpeed + ' km/h')
            ])
          ]),

          // New Air Quality Element - positioned higher to avoid alert banner
          React.createElement("div", { 
            key: "weather-air-quality",
            style: { 
              width: "100%",
              padding: "6px 8px",
              margin: "-16px 0 4px 0" // Increased negative top margin to push even higher
            }
          }, [
            React.createElement("div", { 
              key: "air-quality-item",
              style: { 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 6px"
              }
            }, [
              React.createElement("span", { 
                key: "air-quality-label",
                style: { 
                  fontSize: "13px",
                  color: "#ffffffff",
                  opacity: 1,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                  fontWeight: "600",
                  letterSpacing: "0.3px",
                  whiteSpace: "nowrap"
                }
              }, "Chất lượng không khí"),
              React.createElement("span", { 
                key: "air-quality-status-value",
                style: { 
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "#48bb78",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(72, 187, 120, 0.3)",
                  padding: "2px 8px",
                  whiteSpace: "nowrap"
                }
              }, "TỐT")
            ])
          ]),

          // Air quality status (bottom of left column)
          React.createElement("div", { 
            key: "air-quality-status",
            style: { 
              fontSize: "14px", 
              color: "#ffffffff",
              opacity: 1,
              textAlign: "center", 
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
              whiteSpace: "nowrap"
            }
          }, `Chất lượng không khí: ${weatherData.airQuality}`)
        ]),

        // Right column - Device measurements (like in image)
        React.createElement("div", { 
          key: "weather-right",
          style: { 
            flex: "0 0 140px",
            background: "transparent",
            padding: "12px",
            display: "flex",
            flexDirection: "column"
          }
        }, [
          React.createElement("div", { 
            key: "device-title",
            className: "device-title-aligned" // Using CSS class instead of inline styles
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
                  fontSize: "13px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
                }
            }, `${weatherData.temperature}°`)
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
                  fontSize: "13px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
                }
            }, `${weatherData.humidity}%`)
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
                  fontSize: "13px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
                }
            }, [
              "2,06",
              React.createElement("span", { 
                key: "unit",
                  style: { fontSize: "9px", fontWeight: "normal", opacity: 0.8, marginLeft: "2px" }
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
                  fontSize: "13px", 
                  fontWeight: "bold", 
                  color: "#ffffff", 
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" 
                }
            }, [
              "2,4",
              React.createElement("span", { 
                key: "unit",
                  style: { fontSize: "9px", fontWeight: "normal", opacity: 0.8, marginLeft: "2px" }
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
              padding: "4px 8px",
              borderRadius: "6px",
              marginTop: "-4px", // Further reduced to negative margin to move even higher
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
              boxShadow: "0 2px 4px rgba(74, 222, 128, 0.3)"
            }
          }, "TỐT")
        ])
      ]),



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
      src: `file://${logo.path}`,
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
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
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
    this.mqttClient = null;
    this.updateTimer = null;
    this.isUpdating = false;
    this.dataUpdateCallbacks = [];
    this.statusUpdateCallbacks = [];
    
    console.log("EraIotService: Initializing with authToken", config.authToken);
    
    // Extract gateway token from authToken
    this.gatewayToken = this.extractGatewayToken(config.authToken);
    if (!this.gatewayToken) {
      console.error("EraIotService: Could not extract GATEWAY_TOKEN from authToken");
      return;
    }
    
    console.log("EraIotService: Successfully extracted gateway token");
    console.log("EraIotService: Creating MQTT service with config", {
      enabled: config.enabled,
      gatewayToken: this.gatewayToken.substring(0, 10) + "...",
      sensorConfigs: config.sensorConfigs,
    });
    
    console.log("EraIotService: Initialized with config", config);
  }

  extractGatewayToken(authToken) {
    // AuthToken format from test-era-mqtt-simple.js: "Token 78072b06a81e166b8b900d95f4c2ba1234272955"
    const tokenMatch = authToken.match(/Token\s+(.+)/);
    const extractedToken = tokenMatch ? tokenMatch[1] : null;
    console.log("EraIotService: Token extraction", {
      originalToken: authToken.substring(0, 20) + "...",
      extractedToken: extractedToken ? extractedToken.substring(0, 10) + "..." : null,
      success: !!extractedToken
    });
    return extractedToken;
  }

  async startPeriodicUpdates() {
    if (this.updateTimer) {
      this.stopPeriodicUpdates();
    }

    console.log("EraIotService: Starting MQTT connection...");
    
    try {
      await this.connectMQTT();
      console.log("EraIotService: Started MQTT-based sensor data service");
      console.log("EraIotService: Started MQTT callback updates every 1 second for real-time UI responsiveness");
    } catch (error) {
      console.error("EraIotService: Failed to start MQTT connection:", error);
    }
  }

  async connectMQTT() {
    if (this.mqttClient) {
      console.warn("EraIotService: Already connected or connecting");
      return;
    }

    try {
      // E-RA MQTT Configuration exactly like test-era-mqtt-simple.js
      const brokerUrl = "mqtt://mqtt1.eoh.io:1883";
      
      console.log("EraIotService: E-Ra MQTT Configuration Test");
      console.log("EraIotService: ============================");
      console.log("EraIotService: Broker: mqtt1.eoh.io:1883");
      console.log("EraIotService: Username:", this.gatewayToken.substring(0, 10) + "...");
      console.log("EraIotService: Password:", this.gatewayToken.substring(0, 10) + "...");
      console.log("EraIotService: Topic:", `eoh/chip/${this.gatewayToken}/config/+/value`);
      console.log("EraIotService: Sensor configs:", this.config.sensorConfigs);
      console.log("");

      // Check if MQTT.js is available like in test file
      if (typeof mqtt === 'undefined') {
        console.log("EraIotService: ❌ MQTT.js library not found. Install with: npm install mqtt");
        console.log("EraIotService:    For testing purposes, showing configuration only.");
        this.useFallbackData({ message: "MQTT.js library not available" });
        return;
      } else {
        console.log("EraIotService: ✅ MQTT.js library available");
      }

      console.log("EraIotService: Testing connection to E-Ra MQTT broker...");

      // Use exact connection options from test-era-mqtt-simple.js
      this.mqttClient = mqtt.connect(brokerUrl, {
        username: this.gatewayToken,
        password: this.gatewayToken,
        clientId: `test_${this.gatewayToken}_${Date.now()}`,
        keepalive: 60,
        connectTimeout: 15000,
        clean: true,
      });

      // Set connection timeout like in test file
      let connectionTimer = setTimeout(() => {
        console.log("EraIotService: ❌ Connection timeout");
        this.mqttClient.end();
        this.useFallbackData({ message: "Connection timeout" });
      }, 20000);

      this.mqttClient.on("connect", () => {
        clearTimeout(connectionTimer);
        console.log("EraIotService: ✅ Successfully connected to E-Ra MQTT broker!");
        this.subscribeToTopics();
        this.startPeriodicDataUpdates();
      });

      this.mqttClient.on("message", (topic, message) => {
        this.handleMqttMessage(topic, message);
      });

      this.mqttClient.on("error", (error) => {
        clearTimeout(connectionTimer);
        console.log("EraIotService: ❌ Connection error:", error.message);
        this.mqttClient.end();
        this.useFallbackData(error);
      });

      this.mqttClient.on("close", () => {
        console.log("EraIotService: Connection closed");
      });

    } catch (error) {
      console.error("EraIotService: Failed to connect:", error);
      this.useFallbackData(error);
    }
  }

  subscribeToTopics() {
    if (!this.mqttClient || !this.mqttClient.connected) {
      console.warn("EraIotService: Cannot subscribe - client not connected");
      return;
    }

    // E-RA Topic pattern exactly like test-era-mqtt-simple.js: eoh/chip/{token}/config/+/value
    const testTopic = `eoh/chip/${this.gatewayToken}/config/+/value`;
    this.mqttClient.subscribe(testTopic, { qos: 1 }, (err) => {
      if (err) {
        console.log("EraIotService: ❌ Failed to subscribe:", err.message);
      } else {
        console.log("EraIotService: ✅ Successfully subscribed to:", testTopic);
        console.log("");
        console.log("EraIotService: Waiting for messages...");
        console.log("EraIotService: Expected topic format: eoh/chip/{token}/config/{configId}/value");
        console.log('EraIotService: Expected payload format: {"key": value}');
      }
    });
  }

  handleMqttMessage(topic, message) {
    try {
      const messageStr = message.toString();
      console.log(`EraIotService: [${new Date().toLocaleTimeString()}] ${topic}: ${messageStr}`);

      // DEBUG: Show raw message details exactly like test file
      console.log(`EraIotService: Message Details:`);
      console.log(`EraIotService: Raw Buffer: [${Array.from(message).join(", ")}]`);
      console.log(`EraIotService: String Length: ${messageStr.length}`);
      console.log(`EraIotService: Hex: ${message.toString("hex")}`);

      // Try to parse E-RA format exactly like test file
      try {
        const data = JSON.parse(messageStr);
        console.log("EraIotService: ✅ Parsed as JSON:", data);
        console.log("EraIotService: 📊 Data type:", typeof data);
        console.log("EraIotService: 🔑 Keys:", Object.keys(data));

        // Check for "+" parsing requirement exactly like test file
        if (typeof data === "object" && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            console.log(`EraIotService:      ${key}: ${value} (type: ${typeof value})`);

            // Check if value contains "+" that needs parsing
            if (typeof value === "string" && value.includes("+")) {
              console.log(`EraIotService:       🎯 Found "+" in value, needs parsing: ${value}`);

              // Try different parsing strategies exactly like test file
              const strategies = [
                () => parseFloat(value.replace("+", "")), // Remove +
                () => parseFloat(value), // Direct parse
                () => parseFloat(value.split("+")[0]), // Take before +
                () => parseFloat(value.split("+")[1]), // Take after +
                () => value.split("+").map((v) => parseFloat(v)), // Split and parse both
              ];

              strategies.forEach((strategy, index) => {
                try {
                  const result = strategy();
                  console.log(`EraIotService:         Strategy ${index + 1}: ${JSON.stringify(result)}`);
                } catch (error) {
                  console.log(`EraIotService:         Strategy ${index + 1}: Failed - ${error.message}`);
                }
              });
            }
          });
        }

        // Extract config ID from topic exactly like test file
        const configIdMatch = topic.match(/\/config\/(\d+)\/value$/);
        if (configIdMatch) {
          const configId = parseInt(configIdMatch[1]);
          console.log(`EraIotService:    🆔 Config ID: ${configId}`);

          // Map to sensor type
          const sensorType = Object.entries(this.config.sensorConfigs).find(
            ([, id]) => id === configId
          )?.[0];

          if (sensorType) {
            console.log(`EraIotService:    🌡️ Sensor: ${sensorType}`);
          }
        }

        this.updateSensorDataByConfigId(configId, data);

      } catch (error) {
        console.log("EraIotService:   ❌ Could not parse as JSON:", error.message);
        console.log("EraIotService:   📝 Trying as plain text...");

        // Try parsing as plain text with "+" handling exactly like test file
        if (messageStr.includes("+")) {
          console.log(`EraIotService:   🎯 Found "+" in plain text: ${messageStr}`);

          const strategies = [
            () => parseFloat(messageStr.replace("+", "")),
            () => parseFloat(messageStr),
            () => messageStr.split("+").map((v) => parseFloat(v.trim())),
          ];

          strategies.forEach((strategy, index) => {
            try {
              const result = strategy();
              console.log(`EraIotService:      Plain Strategy ${index + 1}: ${JSON.stringify(result)}`);
            } catch (error) {
              console.log(`EraIotService:      Plain Strategy ${index + 1}: Failed - ${error.message}`);
            }
          });
        }

        // Try parsing as number exactly like test file
        const numValue = parseFloat(messageStr);
        if (!isNaN(numValue)) {
          console.log(`EraIotService:   📊 Parsed as number: ${numValue}`);
          
          // Extract config ID from topic
          const configIdMatch = topic.match(/\/config\/(\d+)\/value$/);
          if (configIdMatch) {
            const configId = parseInt(configIdMatch[1]);
            this.updateSensorDataByConfigId(configId, { value: numValue });
          }
        }
      }
      console.log("");

    } catch (error) {
      console.error("EraIotService: Error processing message:", error);
    }
  }

  updateSensorDataByConfigId(configId, data) {
    // Extract value from E-RA message format exactly like test file processing
    let value = null;

    if (typeof data === "object" && data !== null) {
      const possibleKeys = Object.keys(data);
      if (possibleKeys.length === 1) {
        const singleKey = possibleKeys[0];
        const potentialValue = data[singleKey];

        if (typeof potentialValue === "string") {
          value = this.parseEraValue(potentialValue);
        } else if (typeof potentialValue === "number" && !isNaN(potentialValue)) {
          value = potentialValue;
        }
      }

      if (value === null) {
        const commonValue = data.value ?? data.current_value ?? data.data ?? null;
        if (commonValue !== null) {
          if (typeof commonValue === "string") {
            value = this.parseEraValue(commonValue);
          } else if (typeof commonValue === "number" && !isNaN(commonValue)) {
            value = commonValue;
          }
        }
      }
    } else if (typeof data === "number" && !isNaN(data)) {
      value = data;
    } else if (typeof data === "string") {
      value = this.parseEraValue(data);
    }

    if (value === null || isNaN(value)) {
      console.warn(`EraIotService: Could not extract numeric value from config ID ${configId}:`, data);
      return;
    }

    // Map config ID to sensor type
    const sensorType = this.mapConfigIdToSensorType(configId);
    if (sensorType) {
      console.log(`EraIotService: 🔄 Updating ${sensorType} (ID: ${configId}) = ${value}`);
      
      if (!this.currentData) {
        this.currentData = {
          temperature: null,
          humidity: null,
          pm25: null,
          pm10: null,
          lastUpdated: new Date(),
          status: "success",
        };
      }
      
      this.currentData[sensorType] = value;
      this.currentData.lastUpdated = new Date();
      this.notifyDataUpdateCallbacks();
    } else {
      console.warn(`EraIotService: ❓ Unknown config ID: ${configId}`);
    }
  }

  parseEraValue(valueStr) {
    try {
      // Apply exact parsing strategies from test-era-mqtt-simple.js
      if (valueStr.includes("+")) {
        console.log(`EraIotService: 🎯 Found "+" in value, needs parsing: ${valueStr}`);

        // Try different parsing strategies exactly like test file
        const strategies = [
          () => parseFloat(valueStr.replace("+", "")), // Remove +
          () => parseFloat(valueStr), // Direct parse
          () => parseFloat(valueStr.split("+")[0]), // Take before +
          () => parseFloat(valueStr.split("+")[1]), // Take after +
          () => valueStr.split("+").map((v) => parseFloat(v)), // Split and parse both
        ];

        strategies.forEach((strategy, index) => {
          try {
            const result = strategy();
            console.log(`EraIotService:         Strategy ${index + 1}: ${JSON.stringify(result)}`);
            
            // Use first successful strategy that gives a valid number
            if (index === 0 && !isNaN(result)) {
              return result;
            }
          } catch (error) {
            console.log(`EraIotService:         Strategy ${index + 1}: Failed - ${error.message}`);
          }
        });

        // If strategies didn't work, try the remove + approach
        const withoutPlus = valueStr.replace("+", "");
        const parsed = parseFloat(withoutPlus);
        if (!isNaN(parsed)) {
          console.log(`EraIotService: Parsed E-RA value "${valueStr}" as ${parsed} (removed + prefix)`);
          return parsed;
        }
      }

      const directParse = parseFloat(valueStr);
      if (!isNaN(directParse)) {
        console.log(`EraIotService: Parsed E-RA value "${valueStr}" as ${directParse} (direct parse)`);
        return directParse;
      }

      if (valueStr.includes(",")) {
        const withDot = valueStr.replace(",", ".");
        const parsed = parseFloat(withDot);
        if (!isNaN(parsed)) {
          console.log(`EraIotService: Parsed E-RA value "${valueStr}" as ${parsed} (comma to dot)`);
          return parsed;
        }
      }

      const numericMatch = valueStr.match(/[-+]?\d*\.?\d+/);
      if (numericMatch) {
        const parsed = parseFloat(numericMatch[0]);
        if (!isNaN(parsed)) {
          console.log(`EraIotService: Parsed E-RA value "${valueStr}" as ${parsed} (regex extract)`);
          return parsed;
        }
      }

      console.warn(`EraIotService: Could not parse E-RA value: "${valueStr}"`);
      return null;
    } catch (error) {
      console.error(`EraIotService: Error parsing E-RA value "${valueStr}":`, error);
      return null;
    }
  }

  mapConfigIdToSensorType(configId) {
    if (this.config.sensorConfigs.temperature === configId) return "temperature";
    if (this.config.sensorConfigs.humidity === configId) return "humidity";
    if (this.config.sensorConfigs.pm25 === configId) return "pm25";
    if (this.config.sensorConfigs.pm10 === configId) return "pm10";
    return null;
  }

  handleLwtMessage(messageStr) {
    try {
      const lwtData = JSON.parse(messageStr);
      if (lwtData.ol === 1) {
        console.log("MqttService: Gateway is online");
      } else if (lwtData.ol === 0) {
        console.log("MqttService: Gateway is offline");
      }
    } catch (error) {
      console.warn("MqttService: Could not parse LWT message:", messageStr);
    }
  }

  startPeriodicDataUpdates() {
    // Set up callback notifier every 1 second to ensure UI updates
    this.updateTimer = setInterval(() => {
      if (this.currentData) {
        console.log("EraIotService: Periodic update triggered - data pushed to components");
        this.notifyDataUpdateCallbacks();
      }
    }, 1000); // 1000ms = 1 second

    console.log("EraIotService: ✅ Started MQTT callback updates every 1 second for real-time UI responsiveness");
  }

  stopPeriodicUpdates() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      console.log("EraIotService: Stopped periodic updates");
    }
  }

  async fetchSensorData() {
    // MQTT-based data fetching - removed API calls
    // Data is now received through MQTT service automatically
    console.log("EraIotService: Using MQTT-based data updates");
    
    // Use current MQTT data or fallback values
    if (this.currentData) {
      this.notifyDataUpdateCallbacks();
      console.log("EraIotService: MQTT data available, notifying callbacks");
    } else {
      this.useFallbackData({ message: "MQTT data not yet available" });
    }
  }

  // fetchSensorValue method removed - now using MQTT-based data updates
  // All HTTP API calls have been eliminated

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
      errorMessage: `Connection failed: ${error.message || "Unknown error"}`,
    };
    
    // Notify callbacks about fallback data
    this.notifyDataUpdateCallbacks();
    
    console.log("EraIotService: Using fallback sensor data");
  }

  getCurrentData() {
    return this.currentData;
  }

  async refreshData() {
    console.log("EraIotService: Manual refresh requested - using MQTT data");
    // In MQTT mode, just notify callbacks with current data
    if (this.currentData) {
      this.notifyDataUpdateCallbacks();
    }
  }

  destroy() {
    this.stopPeriodicUpdates();
    this.currentData = null;
    this.dataUpdateCallbacks = [];
    this.statusUpdateCallbacks = [];
    console.log("EraIotService: Destroyed");
  }

  // Notify all data update callbacks with current data
  notifyDataUpdateCallbacks() {
    if (!this.currentData) return;

    this.dataUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error("EraIotService: Error in data update callback:", error);
      }
    });
  }

  // Subscribe to real-time data updates
  onDataUpdate(callback) {
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

  // Subscribe to service status updates
  onStatusUpdate(callback) {
    this.statusUpdateCallbacks.push(callback);

    // Immediately call with current status
    try {
      const status = {
        isRunning: !!this.updateTimer,
        lastUpdate: this.currentData?.lastUpdated || null,
        retryCount: 0,
        currentStatus: this.currentData?.status || "inactive",
      };
      callback(status);
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

    console.log("IoTPanel: Initializing with real-time E-Ra IoT service (1-second updates)");

    const pollInterval = setInterval(() => {
      const data = eraIotService.getCurrentData();
      if (data) {
        console.log("IoTPanel: Real-time sensor data update:", data);
        setSensorData(data);
        setIsLoading(false);
        setConnectionStatus(data.status === "error" ? "error" : "connected");
      }
    }, 1000); // Now polls every 1 second to match service update frequency

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
        value: data.temperature !== null ? `${data.temperature.toFixed(1)}` : "--",
        unit: "°C",
        status: getSensorStatus(data.temperature, "temperature"),
      },
      {
        label: "Độ ẩm",
        value: data.humidity !== null ? `${data.humidity.toFixed(1)}` : "--",
        unit: "%",
        status: getSensorStatus(data.humidity, "humidity"),
      },
      {
        label: "PM2.5",
        value: data.pm25 !== null ? `${data.pm25.toFixed(1)}` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm25, "pm25"),
      },
      {
        label: "PM10",
        value: data.pm10 !== null ? `${data.pm10.toFixed(1)}` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm10, "pm10"),
      },
    ];
  };

  if (isLoading && !sensorData) {
    return React.createElement("div", {
      style: {
        width: "153.6px",
        height: "288px",
        color: "#fff",
        background: "transparent",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "14px",
        padding: "8px",
        boxSizing: "border-box",
      }
    }, [
      React.createElement("div", { key: "title", style: { fontSize: "14px", fontWeight: "bold", marginBottom: "6px" } }, "THIẾT BỊ ĐO"),
      React.createElement("div", { key: "loading", style: { fontSize: "8px", color: "#888" } }, "Đang kết nối...")
    ]);
  }

  if (!eraIotService || (!sensorData && connectionStatus === "error")) {
    return React.createElement("div", {
      style: {
        width: "153.6px",
        height: "288px",
        color: "#fff",
        background: "transparent",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "14px",
        padding: "8px",
        boxSizing: "border-box",
      }
    }, [
      React.createElement("div", { key: "title", style: { fontSize: "14px", fontWeight: "bold", marginBottom: "6px" } }, "THIẾT BỊ ĐO"),
      React.createElement("div", { key: "error", style: { fontSize: "8px", color: "#ff4444" } }, !eraIotService ? "Chưa cấu hình" : "Lỗi kết nối")
    ]);
  }

  if (!sensorData) {
    return React.createElement("div", {
      style: {
        width: "153.6px",
        height: "288px",
        color: "#fff",
        background: "transparent",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "14px",
        padding: "8px",
        boxSizing: "border-box",
      }
    }, [
      React.createElement("div", { key: "title", style: { fontSize: "11px", fontWeight: "bold", marginBottom: "6px" } }, "THIẾT BỊ ĐO"),
      React.createElement("div", { key: "offline", style: { fontSize: "8px", color: "#888" } }, "Không có dữ liệu")
    ]);
  }

  // Calculate Air Quality Index based on PM2.5 and PM10
  const calculateAirQuality = (data) => {
    if (data.pm25 === null && data.pm10 === null) {
      return { status: "KHÔNG XÁC ĐỊNH", color: "#757575", label: "Không có dữ liệu" };
    }

    let pm25Level = 0;
    let pm10Level = 0;

    // WHO Air Quality Guidelines 2021 & EPA standards
    if (data.pm25 !== null) {
      if (data.pm25 <= 15) pm25Level = 1; // Good
      else if (data.pm25 <= 25) pm25Level = 2; // Moderate  
      else if (data.pm25 <= 37.5) pm25Level = 3; // Unhealthy for sensitive
      else if (data.pm25 <= 75) pm25Level = 4; // Unhealthy
      else pm25Level = 5; // Very unhealthy
    }

    if (data.pm10 !== null) {
      if (data.pm10 <= 25) pm10Level = 1; // Good
      else if (data.pm10 <= 50) pm10Level = 2; // Moderate
      else if (data.pm10 <= 90) pm10Level = 3; // Unhealthy for sensitive 
      else if (data.pm10 <= 180) pm10Level = 4; // Unhealthy
      else pm10Level = 5; // Very unhealthy
    }

    // Take the worst level between PM2.5 and PM10
    const maxLevel = Math.max(pm25Level, pm10Level);

    switch (maxLevel) {
      case 1:
        return { status: "TỐT", color: "#4CAF50", label: "Chất lượng không khí tốt" };
      case 2:
        return { status: "TRUNG BÌNH", color: "#FFC107", label: "Chất lượng không khí ở mức chấp nhận được" };
      case 3:
        return { status: "KÉM", color: "#FF9800", label: "Có thể gây hại cho nhóm nhạy cảm" };
      case 4:
        return { status: "XẤU", color: "#F44336", label: "Có thể gây hại cho sức khỏe" };
      case 5:
        return { status: "RẤT XẤU", color: "#9C27B0", label: "Nguy hiểm cho sức khỏe" };
      default:
        return { status: "TỐT", color: "#4CAF50", label: "Chất lượng không khí tốt" };
    }
  };

  const sensors = formatSensorData(sensorData);
  const airQuality = calculateAirQuality(sensorData);

  return React.createElement("div", {
    className: "iot-panel " + className,
    style: {
      width: "153.6px",
      height: "288px",
      color: "#fff",
      // background: "transparent",
      // backgroundColor: "transparent",
      display: "flex",
      flexDirection: "column",
      padding: "8px",
      boxSizing: "border-box",
      fontSize: "14px",
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
        // background: "transparent",
        zIndex: 1
      }
    }),
    // Header
    React.createElement("div", {
      key: "header",
      style: {
        textAlign: "center",
        marginBottom: "8px",
        position: "relative",
        zIndex: 2,
        paddingLeft: "6px",
      }
    }, [
      React.createElement("div", { 
        key: "title", 
        style: { 
          fontSize: "16px", // Changed from 14px to 16px to match city name
          fontWeight: "bold", 
          letterSpacing: "0.8px", 
          color: "#ffffff",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.1)",
          textTransform: "uppercase",
          textAlign: "left", // Changed from center to left to align with city name
          marginBottom: "2px"
        } 
      }, "THIẾT BỊ ĐO"),
      React.createElement("div", {
        key: "status",
        style: {
          position: "absolute",
          top: "0",
          right: "0",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: connectionStatus === "connected" ? "#4CAF50" : connectionStatus === "error" ? "#f44336" : "#888",
        }
      })
    ]),

    // Status banner for partial/error states
    sensorData.status !== "success" && React.createElement("div", {
      key: "status-banner",
      style: {
        width: "100%",
        padding: "4px 6px",
        textAlign: "center",
        fontSize: "8px",
        fontWeight: "bold",
        marginBottom: "6px",
        borderRadius: "3px",
        backgroundColor: sensorData.status === "partial" ? "rgba(255, 193, 7, 0.8)" : "rgba(244, 67, 54, 0.8)",
        color: sensorData.status === "partial" ? "#333" : "white",
        position: "relative",
        zIndex: 2,
      }
    }, sensorData.status === "partial" ? "Một số cảm biến offline" : "Lỗi kết nối"),

    // Sensors grid - Single column layout, 4 rows
    React.createElement("div", {
      key: "sensors-grid",
      style: {
        display: "grid",
        gridTemplateColumns: "1fr", // Single column
        gridTemplateRows: "repeat(4, 1fr)", // 4 equal rows
        gap: "6px",
        marginBottom: "8px",
        position: "relative",
        zIndex: 2,
        width: "95%", // Fill almost full width
        margin: "0 auto 8px auto", // Center the grid
      }
    }, sensors.map((sensor, index) => 
      React.createElement("div", {
        key: index,
        style: {
          display: "flex",
          flexDirection: "row", // Horizontal layout
          alignItems: "center",
          justifyContent: "space-between", // Space between label and value
          textAlign: "left",
          padding: "8px 12px", // More padding for better appearance
          background: "transparent", // No background
          width: "100%", // Fill full width
          boxSizing: "border-box",
        }
      }, [
        React.createElement("div", {
          key: "label",
          style: { 
            fontSize: "14px", // Increased font size for better readability
            fontWeight: "bold",
            color: "white",
            opacity: 0.9,
            whiteSpace: "nowrap", // Prevent text wrapping
            flex: 1, // Take available space on left
            textAlign: "left",
          }
        }, sensor.label),
        React.createElement("div", {
          key: "value-container",
          style: { 
            display: "flex",
            alignItems: "baseline",
            justifyContent: "flex-end", // Right align values
            flexShrink: 0 // Don't shrink
          }
        }, [
          React.createElement("span", { 
            key: "value", 
            style: { 
              fontSize: "16px", // Larger value font for better visibility
              fontWeight: "bold",
              marginRight: "4px", // Space before unit
              color: "white",
              whiteSpace: "nowrap" // Prevent wrapping
            } 
          }, sensor.value),
          React.createElement("span", { 
            key: "unit", 
            style: { 
              fontSize: "10px", // Slightly larger unit font
              opacity: 0.8,
              fontWeight: "normal",
              whiteSpace: "nowrap", // Prevent wrapping
              color: "#b3d9ff" // Light blue color for units
            } 
          }, sensor.unit)
        ])
      ])
    )),

    // Air Quality Indicator
    React.createElement("div", {
      key: "air-quality-container",
      style: {
        display: "flex",
        justifyContent: "center",
        margin: "-4px auto 8px auto", // Negative top margin to move up, keep bottom margin for spacing from bottom
        width: "95%",
        position: "relative",
        zIndex: 2,
      }
    }, React.createElement("div", {
      key: "air-quality-indicator", 
      style: {
        backgroundColor: airQuality.color,
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
        padding: "6px 16px",
        borderRadius: "6px",
        textAlign: "center",
        letterSpacing: "0.5px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        minWidth: "60px"
      }
    }, airQuality.status)),

    // Simple footer
    React.createElement("div", {
      key: "footer",
      style: {
        marginTop: "1px", // Fixed margin instead of auto
        paddingTop: "4px",
        fontSize: "7px",
        color: "#888",
        textAlign: "center",
        position: "relative",
        zIndex: 2,
        opacity: 0.7,
        fontWeight: "normal",
      }
    }, sensorData ? sensorData.lastUpdated.toLocaleTimeString("vi-VN") : "")
  ]);
}

// Updated BillboardLayout with E-Ra IoT integration and full-width Weather Alert Banner
function BillboardLayout() {
  const [eraIotService, setEraIotService] = React.useState(null);
  const [weatherData, setWeatherData] = React.useState(null);
  const [showWeatherAlert, setShowWeatherAlert] = React.useState(false);
  const [configReloadTrigger, setConfigReloadTrigger] = React.useState(0);

  console.log("BillboardLayout: Component initialized");

  React.useEffect(() => {
    console.log("BillboardLayout: useEffect triggered - configReloadTrigger:", configReloadTrigger);
    
    const initializeEraIot = async () => {
      try {
        console.log("BillboardLayout: Loading E-Ra IoT configuration...");
        
        // Cleanup existing service first
        if (eraIotService) {
          console.log("BillboardLayout: Cleaning up existing E-Ra IoT service");
          eraIotService.destroy();
          setEraIotService(null);
        }
        
        if (typeof window !== "undefined" && window.electronAPI) {
          console.log("BillboardLayout: electronAPI available, fetching config...");
          
          const config = await window.electronAPI.getConfig();
          console.log("BillboardLayout: Raw config received:", {
            hasEraIot: !!config?.eraIot,
            enabled: config?.eraIot?.enabled,
            hasAuthToken: !!config?.eraIot?.authToken,
          });
          
          if (config?.eraIot?.authToken && config.eraIot.authToken.trim() !== "") {
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
            console.log("BillboardLayout: E-Ra IoT service initialized successfully");
          } else {
            console.log("BillboardLayout: No valid E-Ra IoT AUTHTOKEN found or empty token");
            setEraIotService(null);
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
  }, [configReloadTrigger]); // Re-run when config changes

  // Set up hot-reload listeners for configuration changes
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      console.log("BillboardLayout: Setting up config hot-reload listeners");
      
      const handleConfigUpdate = (event, newConfig) => {
        console.log("BillboardLayout: Configuration hot-reload triggered", newConfig);
        setConfigReloadTrigger(prev => prev + 1);
      };
      
      const handleForceRefresh = (event, newConfig) => {
        console.log("BillboardLayout: Force refresh services triggered", newConfig);
        setConfigReloadTrigger(prev => prev + 1);
      };
      
      // Set up listeners
      window.electronAPI.onConfigUpdated(handleConfigUpdate);
      window.electronAPI.onForceRefreshServices(handleForceRefresh);
      
      return () => {
        console.log("BillboardLayout: Cleaning up config listeners");
        window.electronAPI.removeConfigListener();
        window.electronAPI.removeForceRefreshListener();
      };
    }
  }, []);

  // Subscribe to weather data updates for alert banner
  React.useEffect(() => {
    const unsubscribe = GlobalWeatherServiceManager.subscribe((data) => {
      setWeatherData(data);
      
      // Always show weather banner, just change the content and status
      if (data) {
        const isHighRainRisk = data.rainProbability > 60 || 
                              data.weatherCondition?.includes("mưa to") || 
                              data.weatherCondition?.includes("dông");
        setShowWeatherAlert(isHighRainRisk);
        console.log("BillboardLayout: Weather banner - High rain risk:", isHighRainRisk, "Rain probability:", data.rainProbability);
      } else {
        setShowWeatherAlert(false); // Default to stable when no data
      }
    });

    return unsubscribe;
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
      position: "relative",
    }
  }, [
    React.createElement("div", {
      key: "top-row",
      style: {
        height: "288px", // Fixed height - LED specification requirement
        display: "flex",
        width: "100%",
      }
    }, [
      React.createElement(WeatherPanel, { key: "weather", className: "unified-weather" })
    ]),
    
    // Weather Banner - Always visible with dynamic content
    React.createElement("div", { 
      key: "global-weather-banner",
      style: { 
        position: "absolute",
        bottom: "110px", // Position above logo with 14px spacing from logo section
        left: "16px", // 16px margin from left edge
        right: "16px", // 16px margin from right edge  
        height: "48px", // Fixed banner height
        width: "calc(100% - 32px)", // Full width minus left and right margins
        background: showWeatherAlert 
          ? "linear-gradient(135deg, #dc2626, #b91c1c)" // Red for high rain risk
          : "linear-gradient(135deg, #059669, #047857)", // Green for stable weather
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "0 16px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "1px",
        boxShadow: showWeatherAlert 
          ? "0 4px 12px rgba(220, 38, 38, 0.4)" // Red shadow for alert
          : "0 4px 12px rgba(5, 150, 105, 0.4)", // Green shadow for stable
        zIndex: 10000000,
        boxSizing: "border-box",
        borderRadius: "4px", // Subtle rounding for modern look
      }
    }, [
      React.createElement("div", {
        key: "banner-icon",
        style: {
          background: showWeatherAlert ? "#fbbf24" : "#10b981", // Yellow for alert, light green for stable
          color: showWeatherAlert ? "#dc2626" : "#ffffff",
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
      }, showWeatherAlert ? "!" : "✓"),
      React.createElement("div", {
        key: "banner-text",
        style: {
          fontSize: "16px",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
          flex: 1,
          textAlign: "center"
        }
      }, showWeatherAlert ? "CẢNH BÁO MƯA LỚN" : "THỜI TIẾT ỔN ĐỊNH")
    ]),
    
    React.createElement("div", {
      key: "logo-section",
      style: {
        height: "96px", // Fixed height - LED specification requirement
        width: "100%",
        backgroundColor: "#ff6b35",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        position: "relative",
        overflow: "hidden",
      }
    }, React.createElement(CompanyLogo, { key: "logo" }))
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