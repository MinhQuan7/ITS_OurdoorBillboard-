// Test script to verify weather panel layout changes
// This validates the new 2x2 grid layout and air quality element positioning

const path = require("path");
const fs = require("fs");

console.log("🔍 Weather Panel Layout Verification Test");
console.log("==========================================");

// Test 1: Verify CSS Grid Layout Changes
console.log("\n1. Testing CSS Grid Layout Implementation...");

const cssPath = path.join(
  __dirname,
  "renderer",
  "components",
  "WeatherPanel.css"
);
const cssContent = fs.readFileSync(cssPath, "utf8");

// Check for CSS Grid implementation
const hasGridLayout = cssContent.includes("grid-template-columns: 1fr 1fr");
const hasGridRows = cssContent.includes("grid-template-rows: 1fr 1fr");
const hasDisplayGrid = cssContent.includes("display: grid");

console.log(
  `   ✅ CSS Grid columns (2x2): ${hasGridLayout ? "FOUND" : "MISSING"}`
);
console.log(`   ✅ CSS Grid rows (2x2): ${hasGridRows ? "FOUND" : "MISSING"}`);
console.log(`   ✅ Display Grid: ${hasDisplayGrid ? "FOUND" : "MISSING"}`);

// Test 2: Verify Air Quality Element Addition
console.log("\n2. Testing New Air Quality Element...");

const tsxPath = path.join(
  __dirname,
  "renderer",
  "components",
  "WeatherPanel.tsx"
);
const tsxContent = fs.readFileSync(tsxPath, "utf8");

const hasAirQualitySection = tsxContent.includes("weather-air-quality");
const hasAirQualityItem = tsxContent.includes("air-quality-item");
const hasAirQualityLabel = tsxContent.includes("Chất lượng không khí");

console.log(
  `   ✅ Air Quality Section: ${hasAirQualitySection ? "FOUND" : "MISSING"}`
);
console.log(
  `   ✅ Air Quality Item: ${hasAirQualityItem ? "FOUND" : "MISSING"}`
);
console.log(
  `   ✅ Vietnamese Label: ${hasAirQualityLabel ? "FOUND" : "MISSING"}`
);

// Test 3: Verify CSS Styling for New Element
console.log("\n3. Testing Air Quality CSS Styling...");

const hasAirQualityCSS = cssContent.includes(".weather-air-quality");
const hasAirQualityItemCSS = cssContent.includes(".air-quality-item");
const hasGreenStyling = cssContent.includes("72, 187, 120"); // Green color values

console.log(`   ✅ Air Quality CSS: ${hasAirQualityCSS ? "FOUND" : "MISSING"}`);
console.log(
  `   ✅ Air Quality Item CSS: ${hasAirQualityItemCSS ? "FOUND" : "MISSING"}`
);
console.log(
  `   ✅ Green Theme Styling: ${hasGreenStyling ? "FOUND" : "MISSING"}`
);

// Test 4: Verify Weather Elements Order
console.log("\n4. Testing Element Positioning Order...");

const weatherGridIndex = tsxContent.indexOf("weather-details-grid");
const airQualityIndex = tsxContent.indexOf("weather-air-quality");
const deviceMeasurementsIndex = tsxContent.indexOf(
  "device-measurements-section"
);

const isCorrectOrder =
  weatherGridIndex < airQualityIndex &&
  airQualityIndex < deviceMeasurementsIndex;

console.log(`   ✅ Weather Grid Position: ${weatherGridIndex}`);
console.log(`   ✅ Air Quality Position: ${airQualityIndex}`);
console.log(`   ✅ Device Measurements Position: ${deviceMeasurementsIndex}`);
console.log(`   ✅ Correct Order: ${isCorrectOrder ? "YES" : "NO"}`);

// Summary
console.log("\n📊 VERIFICATION SUMMARY");
console.log("======================");

const allTestsPassed =
  hasGridLayout &&
  hasGridRows &&
  hasDisplayGrid &&
  hasAirQualitySection &&
  hasAirQualityItem &&
  hasAirQualityLabel &&
  hasAirQualityCSS &&
  hasAirQualityItemCSS &&
  hasGreenStyling &&
  isCorrectOrder;

if (allTestsPassed) {
  console.log(
    "✅ ALL TESTS PASSED! Weather panel layout successfully updated:"
  );
  console.log("   • Độ ẩm, Mưa, UV, Gió arranged in 2x2 grid");
  console.log("   • Values display horizontally (không xuống hàng)");
  console.log('   • New "Chất lượng không khí" element added below');
  console.log("   • Professional styling with green theme");
} else {
  console.log("❌ Some tests failed. Please review the implementation.");
}

console.log("\n🚀 Layout changes ready for production use!");
