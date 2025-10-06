// weather-service-consistency-test.js - Test multiple WeatherService instances consistency
const axios = require("axios");

// Simulate the WeatherService class behavior
class TestWeatherService {
  constructor(id) {
    this.id = id;
    this.currentData = null;
  }

  async fetchWeatherData() {
    try {
      const url =
        "https://api.open-meteo.com/v1/forecast?latitude=16.4637&longitude=107.5909&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,uv_index,apparent_temperature,precipitation_probability,visibility&daily=weathercode&timezone=Asia/Ho_Chi_Minh&forecast_days=1";

      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      const current = data.current_weather;
      const hourly = data.hourly;

      const currentHour = new Date().getHours();

      this.currentData = {
        serviceId: this.id,
        temperature: Math.round(current.temperature),
        humidity: Math.round(hourly.relativehumidity_2m[currentHour] || 70),
        windSpeed: Math.round(current.windspeed),
        weatherCode: current.weathercode,
        timestamp: new Date().toLocaleTimeString(),
        fetchTime: Date.now(),
      };

      return this.currentData;
    } catch (error) {
      console.error(`Service ${this.id} fetch failed:`, error.message);
      return null;
    }
  }

  getCurrentWeather() {
    return this.currentData;
  }
}

async function testMultipleServiceInstances() {
  console.log("=== TESTING MULTIPLE WEATHERSERVICE INSTANCES ===\n");

  // Create 3 separate service instances (simulating the current bug)
  const services = [
    new TestWeatherService("Service-1"),
    new TestWeatherService("Service-2"),
    new TestWeatherService("Service-3"),
  ];

  console.log("Fetching weather data from all services simultaneously...\n");

  // Fetch data from all services at the same time
  const promises = services.map((service) => service.fetchWeatherData());
  const results = await Promise.all(promises);

  // Display results
  results.forEach((result, index) => {
    if (result) {
      console.log(`${result.serviceId}:`);
      console.log(`  Temperature: ${result.temperature}°C`);
      console.log(`  Humidity: ${result.humidity}%`);
      console.log(`  Wind: ${result.windSpeed} km/h`);
      console.log(`  Code: ${result.weatherCode}`);
      console.log(`  Time: ${result.timestamp}`);
      console.log();
    }
  });

  // Analysis
  console.log("=== ANALYSIS ===");
  const validResults = results.filter((r) => r !== null);

  if (validResults.length < 2) {
    console.log("❌ Not enough data to compare");
    return;
  }

  const first = validResults[0];
  let allSame = true;

  for (let i = 1; i < validResults.length; i++) {
    const current = validResults[i];
    if (
      current.temperature !== first.temperature ||
      current.humidity !== first.humidity ||
      current.windSpeed !== first.windSpeed ||
      current.weatherCode !== first.weatherCode
    ) {
      allSame = false;
      console.log(`❌ Data differs between ${first.serviceId} and ${current.serviceId}`);
      console.log(`   Temp: ${first.temperature}° vs ${current.temperature}°`);
      console.log(`   Humidity: ${first.humidity}% vs ${current.humidity}%`);
      console.log(`   Wind: ${first.windSpeed} vs ${current.windSpeed} km/h`);
    }
  }

  if (allSame) {
    console.log("✅ All services returned identical data");
    console.log("   This confirms API data is consistent");
    console.log("   Your UI issue is likely due to:");
    console.log("   1. Multiple WeatherService instances");
    console.log("   2. Race conditions between API calls");
    console.log("   3. Cache invalidation timing issues");
  }

  console.log("\n=== RECOMMENDED SOLUTION ===");
  console.log("1. Use a single global WeatherService instance");
  console.log("2. Implement proper data subscriptions");
  console.log("3. Add intelligent caching with 5-10 minute intervals");
  console.log("4. Prevent rapid refresh clicks with throttling");
}

// Test with delay to simulate user clicking multiple times
async function testClickSimulation() {
  console.log("\n=== SIMULATING USER CLICKS ===\n");

  const service = new TestWeatherService("ClickTest");

  for (let click = 1; click <= 3; click++) {
    console.log(`Click ${click}: Refreshing data...`);
    const data = await service.fetchWeatherData();
    
    if (data) {
      console.log(`  Result: ${data.temperature}°C, ${data.humidity}%, Wind: ${data.windSpeed}km/h`);
    }
    
    // Wait 1 second between clicks (rapid clicking simulation)
    if (click < 3) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function runAllTests() {
  try {
    await testMultipleServiceInstances();
    await testClickSimulation();
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runAllTests();