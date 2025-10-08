/**
 * Quick E-Ra API Endpoint Format Test
 * This script tests the API endpoint format without requiring a real AUTHTOKEN
 */

const axios = require("axios");

async function testEndpointFormat() {
  console.log("Testing E-Ra API Endpoint Format");
  console.log("===================================");

  const baseUrl = "https://backend.eoh.io";
  const sensorId = 138997;
  const testToken = "Token test-placeholder-token";

  // Test different endpoint formats
  const endpoints = [
    `/chip_manager/configs/${sensorId}/current_value/`,
    `/api/chip_manager/configs/${sensorId}/current_value/`,
    `/api/v1/chip_manager/configs/${sensorId}/current_value/`,
    `/v1/chip_manager/configs/${sensorId}/current_value/`,
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${baseUrl}${endpoint}`);

    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          Authorization: testToken,
          Accept: "application/json",
        },
        timeout: 5000,
      });

      console.log(`SUCCESS: Status ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        console.log(`Response Status: ${status}`);

        if (status === 401) {
          console.log(
            "   ENDPOINT FOUND - Authentication required (expected with test token)"
          );
        } else if (status === 404) {
          console.log("   ENDPOINT NOT FOUND");
        } else if (status === 403) {
          console.log(
            "   ENDPOINT FOUND - Access forbidden (expected with test token)"
          );
        } else {
          console.log(`   Unexpected status: ${status}`);
        }
      } else {
        console.log(`   Network Error: ${error.message}`);
      }
    }
  }

  console.log("\nSummary:");
  console.log(
    "If you see 'ENDPOINT FOUND' with status 401 or 403, that endpoint format is correct!"
  );
  console.log("Status 404 means the endpoint doesn't exist.");
  console.log(
    "You need to use your real AUTHTOKEN for successful data retrieval."
  );
}

testEndpointFormat().catch(console.error);
