// WeatherDebug.tsx - Debug component to test weather API
import React, { useState, useEffect } from "react";
import WeatherService, {
  WeatherData,
  WeatherConfig,
} from "../services/weatherService";

const WeatherDebug: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testWeatherService = async () => {
      try {
        const config: WeatherConfig = {
          location: {
            lat: 16.4637,
            lon: 107.5909,
            city: "TP. THỪA THIÊN HUẾ",
          },
          updateInterval: 15,
          retryInterval: 5,
          maxRetries: 3,
        };

        const weatherService = new WeatherService(config);

        // Wait a bit for the service to fetch data
        setTimeout(() => {
          const data = weatherService.getCurrentWeather();
          if (data) {
            setWeatherData(data);
            setIsLoading(false);
            console.log("WeatherDebug: Weather data received:", data);
          } else {
            setError("No weather data available");
            setIsLoading(false);
          }
        }, 3000);
      } catch (err) {
        setError(`Error: ${err}`);
        setIsLoading(false);
        console.error("WeatherDebug: Error testing weather service:", err);
      }
    };

    testWeatherService();
  }, []);

  if (isLoading) {
    return (
      <div style={{ color: "white", padding: "10px" }}>
        Loading weather data...
      </div>
    );
  }

  if (error) {
    return <div style={{ color: "red", padding: "10px" }}>Error: {error}</div>;
  }

  if (!weatherData) {
    return (
      <div style={{ color: "yellow", padding: "10px" }}>
        No weather data available
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "10px",
        zIndex: 1000,
        maxWidth: "200px",
      }}
    >
      <h4>Weather API Debug</h4>
      <div>City: {weatherData.cityName}</div>
      <div>Temperature: {weatherData.temperature}°C</div>
      <div>Feels like: {weatherData.feelsLike}°C</div>
      <div>Humidity: {weatherData.humidity}%</div>
      <div>Wind: {weatherData.windSpeed} km/h</div>
      <div>Rain: {weatherData.rainProbability}%</div>
      <div>UV: {weatherData.uvIndex}</div>
      <div>Condition: {weatherData.weatherCondition}</div>
      <div>Code: {weatherData.weatherCode}</div>
      <div>
        AQI: {weatherData.airQuality} ({weatherData.aqi})
      </div>
      <div>Updated: {weatherData.lastUpdated.toLocaleTimeString()}</div>
    </div>
  );
};

export default WeatherDebug;
