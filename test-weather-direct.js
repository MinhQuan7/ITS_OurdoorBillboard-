// Test weather API directly
const axios = require("axios");

async function testWeatherAPI() {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=16.4637&longitude=107.5909&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,uv_index,apparent_temperature,precipitation_probability,visibility&timezone=Asia/Ho_Chi_Minh&forecast_days=1";

  try {
    console.log("Testing Weather API...");
    console.log("URL:", url);

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "ITS-Billboard/1.0",
      },
    });

    console.log("API Response Status:", response.status);
    console.log("Current Weather:", response.data.current_weather);
    console.log("Has Hourly Data:", !!response.data.hourly);

    if (response.data.current_weather) {
      const current = response.data.current_weather;
      console.log("Temperature:", current.temperature + "°C");
      console.log("Weather Code:", current.weathercode);
      console.log("Wind Speed:", current.windspeed + " km/h");
    }

    return response.data;
  } catch (error) {
    console.error("Weather API Test Failed:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
    throw error;
  }
}

testWeatherAPI()
  .then(() => {
    console.log("Weather API test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Weather API test failed:", error.message);
    process.exit(1);
  });
