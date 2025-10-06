// weather-consistency-test.js - Test script to check weather data consistency
const axios = require("axios");

async function testWeatherDataConsistency() {
  console.log("=== TESTING WEATHER DATA CONSISTENCY ===\n");

  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=16.4637&longitude=107.5909&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,uv_index,apparent_temperature,precipitation_probability,visibility&daily=weathercode&timezone=Asia/Ho_Chi_Minh&forecast_days=1";

  const results = [];

  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`Call ${i}: Fetching weather data...`);
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      const current = data.current_weather;
      const hourly = data.hourly;

      // Get current hour index
      const currentHour = new Date().getHours();

      const weatherResult = {
        call: i,
        timestamp: new Date().toLocaleTimeString(),
        temperature: Math.round(current.temperature),
        feelsLike: Math.round(
          hourly.apparent_temperature[currentHour] || current.temperature
        ),
        humidity: Math.round(hourly.relativehumidity_2m[currentHour] || 70),
        windSpeed: Math.round(current.windspeed),
        uvIndex: Math.round(hourly.uv_index[currentHour] || 0),
        rainProbability: Math.round(
          hourly.precipitation_probability[currentHour] || 20
        ),
        weatherCode: current.weathercode,
      };

      results.push(weatherResult);

      console.log(`  Temperature: ${weatherResult.temperature}°C`);
      console.log(`  Humidity: ${weatherResult.humidity}%`);
      console.log(`  Wind: ${weatherResult.windSpeed} km/h`);
      console.log(`  Rain: ${weatherResult.rainProbability}%`);
      console.log(`  Time: ${weatherResult.timestamp}\n`);
    } catch (error) {
      console.error(`Call ${i} failed:`, error.message);
    }

    // Wait 2 seconds between calls
    if (i < 5) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Analyze consistency
  console.log("\n=== CONSISTENCY ANALYSIS ===");

  if (results.length < 2) {
    console.log("Not enough data to analyze consistency");
    return;
  }

  const firstResult = results[0];
  let isConsistent = true;

  for (let i = 1; i < results.length; i++) {
    const current = results[i];

    if (
      current.temperature !== firstResult.temperature ||
      current.humidity !== firstResult.humidity ||
      current.windSpeed !== firstResult.windSpeed ||
      current.weatherCode !== firstResult.weatherCode
    ) {
      isConsistent = false;
      console.log(`❌ Data changed between call 1 and call ${i + 1}:`);
      console.log(
        `   Temperature: ${firstResult.temperature}° → ${current.temperature}°`
      );
      console.log(
        `   Humidity: ${firstResult.humidity}% → ${current.humidity}%`
      );
      console.log(
        `   Wind: ${firstResult.windSpeed} → ${current.windSpeed} km/h`
      );
      console.log(
        `   Code: ${firstResult.weatherCode} → ${current.weatherCode}`
      );
    }
  }

  if (isConsistent) {
    console.log("✅ Weather data is CONSISTENT across all calls");
    console.log(
      "   This means the API returns the same data for the same time period"
    );
    console.log("   Changes in your app are likely due to:");
    console.log("   1. Multiple WeatherService instances being created");
    console.log("   2. Fallback data being used randomly");
    console.log("   3. Cache invalidation issues");
  } else {
    console.log("ℹ️ Weather data shows minor variations");
    console.log("   This is normal for real-time weather APIs");
    console.log("   Data updates every few minutes from weather stations");
  }

  console.log("\n=== RECOMMENDATION FOR YOUR APP ===");
  console.log("1. Use a single global WeatherService instance");
  console.log("2. Cache weather data for 5-10 minutes");
  console.log("3. Only refresh when data is truly stale");
  console.log("4. Show data source (API/Cache) for debugging");
}

testWeatherDataConsistency();
