// test-weather-api.js - Quick test for weather API
const axios = require("axios");

async function testWeatherAPI() {
  console.log("Testing Open-Meteo Weather API for Hue, Vietnam...");

  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=16.4637&longitude=107.5909&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,uv_index,apparent_temperature,precipitation_probability,visibility&daily=weathercode&timezone=Asia/Ho_Chi_Minh&forecast_days=1";

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    const current = data.current_weather;
    const hourly = data.hourly;

    // Get current hour index
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    console.log("\n=== WEATHER DATA FOR HUE ===");
    console.log(`Current Time: ${new Date().toLocaleString("vi-VN")}`);
    console.log(`Temperature: ${Math.round(current.temperature)}°C`);
    console.log(
      `Feels Like: ${Math.round(
        hourly.apparent_temperature[currentHour] || current.temperature
      )}°C`
    );
    console.log(
      `Humidity: ${Math.round(hourly.relativehumidity_2m[currentHour] || 70)}%`
    );
    console.log(`Wind Speed: ${Math.round(current.windspeed)} km/h`);
    console.log(`UV Index: ${Math.round(hourly.uv_index[currentHour] || 0)}`);
    console.log(
      `Rain Probability: ${Math.round(
        hourly.precipitation_probability[currentHour] || 20
      )}%`
    );
    console.log(`Weather Code: ${current.weathercode}`);
    console.log(`Is Day: ${current.is_day ? "Yes" : "No"}`);

    // Translate weather code
    const getWeatherCondition = (code) => {
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
        80: "Mưa rào nhẹ",
        81: "Mưa rào vừa",
        82: "Mưa rào to",
        95: "Dông",
        96: "Dông có mưa đá nhẹ",
        99: "Dông có mưa đá to",
      };
      return conditions[code] || "Không xác định";
    };

    console.log(
      `Weather Condition: ${getWeatherCondition(current.weathercode)}`
    );
    console.log("\n=== API TEST SUCCESSFUL ===");
  } catch (error) {
    console.error("Error testing weather API:", error.message);
  }
}

testWeatherAPI();
