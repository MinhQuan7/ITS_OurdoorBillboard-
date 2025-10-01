// app.js - Simple JavaScript version for initial learning
// This file creates basic layout without React for easy understanding and quick testing

document.addEventListener("DOMContentLoaded", function () {
  console.log("Billboard App started");

  // Create main layout
  createBillboardLayout();

  // Add click events to demo interaction
  addInteractiveFeatures();
});

/**
 * Create main layout for 384x384 billboard
 */
function createBillboardLayout() {
  const root = document.getElementById("root");

  // Main container
  const container = document.createElement("div");
  container.className = "billboard-container";
  container.style.cssText = `
        width: 384px;
        height: 384px;
        display: flex;
        flex-direction: column;
        background-color: #000;
        color: white;
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
    `;

  // Top row (75% - contains 2 columns)
  const topRow = createTopRow();

  // Bottom row (25% - Company logo)
  const bottomRow = createBottomRow();

  container.appendChild(topRow);
  container.appendChild(bottomRow);
  root.appendChild(container);
}

/**
 * Create top row with 2 columns (Weather + IoT)
 */
function createTopRow() {
  const topRow = document.createElement("div");
  topRow.style.cssText = `
        flex: 3;
        display: flex;
        flex-direction: row;
    `;

  // Left column - Weather Panel
  const leftColumn = createWeatherPanel();

  // Right column - IoT Panel
  const rightColumn = createIoTPanel();

  topRow.appendChild(leftColumn);
  topRow.appendChild(rightColumn);

  return topRow;
}

/**
 * Create Weather Panel (left column)
 */
function createWeatherPanel() {
  const weatherPanel = document.createElement("div");
  weatherPanel.id = "weather-panel";
  weatherPanel.style.cssText = `
        flex: 1;
        background-color: #1a1a2e;
        padding: 10px;
        border: 2px solid #ff0000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    `;

  weatherPanel.innerHTML = `
        <h3 style="font-size: 14px; margin-bottom: 8px; margin-top: 0;">TP. THỪA THIÊN HUẾ</h3>
        <div style="font-size: 32px; font-weight: bold;">24,2°</div>
        <div style="font-size: 12px;">-29,7°</div>
        <div style="font-size: 12px;">Độ ẩm 95% | UV Thấp</div>
        <div style="font-size: 12px;">Mưa 97% | Gió 1,6 km/h</div>
        <div style="font-size: 10px; margin-top: 5px;">Chất lượng không khí: Tốt</div>
    `;

  return weatherPanel;
}

/**
 * Create IoT Panel (right column)
 */
function createIoTPanel() {
  const iotPanel = document.createElement("div");
  iotPanel.id = "iot-panel";
  iotPanel.style.cssText = `
        flex: 1;
        background-color: #16213e;
        padding: 10px;
        border: 2px solid #ff0000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    `;

  iotPanel.innerHTML = `
        <h3 style="font-size: 14px; margin-bottom: 8px; margin-top: 0;">THIẾT BỊ ĐO</h3>
        <div style="font-size: 12px; margin-bottom: 4px;">Nhiệt độ: 24,0°</div>
        <div style="font-size: 12px; margin-bottom: 4px;">Độ ẩm: 96%</div>
        <div style="font-size: 12px; margin-bottom: 4px;">PM2.5: 2,06 μg</div>
        <div style="font-size: 12px; margin-bottom: 4px;">PM10: 2,4 μg</div>
        <div style="font-size: 10px; background-color: green; padding: 2px 6px; border-radius: 3px; margin-top: 5px;">
            TỐT
        </div>
    `;

  return iotPanel;
}

/**
 * Create bottom row with Company Logo
 */
function createBottomRow() {
  const bottomRow = document.createElement("div");
  bottomRow.style.cssText = `
        flex: 1;
        background-color: #ff6b35;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
    `;

  // Logo circle
  const logoCircle = document.createElement("div");
  logoCircle.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-size: 36px;
        font-weight: bold;
        color: #ff6b35;
        cursor: pointer;
    `;
  logoCircle.textContent = "C";
  logoCircle.id = "company-logo";

  // Text container
  const textContainer = document.createElement("div");
  textContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        color: white;
    `;

  const mainText = document.createElement("div");
  mainText.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        line-height: 1.2;
        margin: 0;
    `;
  mainText.textContent = "CÔNG TY";

  const subText = document.createElement("div");
  subText.style.cssText = `
        font-size: 12px;
        line-height: 1.2;
        margin: 0;
        opacity: 0.9;
    `;
  subText.textContent = "VÌ CUỘC SỐNG TỐT ĐẸP HƠN";

  textContainer.appendChild(mainText);
  textContainer.appendChild(subText);

  bottomRow.appendChild(logoCircle);
  bottomRow.appendChild(textContainer);

  return bottomRow;
}

/**
 * Add interactive features to demo event handling
 */
function addInteractiveFeatures() {
  // Click event for Weather Panel
  const weatherPanel = document.getElementById("weather-panel");
  weatherPanel.addEventListener("click", function () {
    console.log("Weather panel clicked!");

    // Toggle background color
    const currentBg = weatherPanel.style.backgroundColor;
    weatherPanel.style.backgroundColor =
      currentBg === "rgb(26, 26, 46)" ? "#2a2a4e" : "#1a1a2e";

    // Show alert message
    showAlert("Weather data refreshed!");
  });

  // Click event for IoT Panel
  const iotPanel = document.getElementById("iot-panel");
  iotPanel.addEventListener("click", function () {
    console.log("IoT panel clicked!");

    // Toggle background color
    const currentBg = iotPanel.style.backgroundColor;
    iotPanel.style.backgroundColor =
      currentBg === "rgb(22, 33, 62)" ? "#323e6e" : "#16213e";

    // Update random data for demo
    updateIoTData();
  });

  // Click event for Company Logo
  const companyLogo = document.getElementById("company-logo");
  companyLogo.addEventListener("click", function () {
    console.log("Company logo clicked!");

    // Rotate animation
    companyLogo.style.transform = "rotate(360deg)";
    companyLogo.style.transition = "transform 1s ease-in-out";

    setTimeout(() => {
      companyLogo.style.transform = "rotate(0deg)";
    }, 1000);
  });

  // Keyboard events
  document.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "1":
        weatherPanel.click();
        break;
      case "2":
        iotPanel.click();
        break;
      case "3":
        companyLogo.click();
        break;
      case "r":
        refreshAllData();
        break;
    }
  });
}

/**
 * Show temporary alert message
 */
function showAlert(message) {
  const alertDiv = document.createElement("div");
  alertDiv.style.cssText = `
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ff0000;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
    `;
  alertDiv.textContent = message;

  document.body.appendChild(alertDiv);

  // Auto remove after 2 seconds
  setTimeout(() => {
    document.body.removeChild(alertDiv);
  }, 2000);
}

/**
 * Update IoT data with random values
 */
function updateIoTData() {
  const iotPanel = document.getElementById("iot-panel");
  const temp = (20 + Math.random() * 10).toFixed(1);
  const humidity = (80 + Math.random() * 20).toFixed(0);
  const pm25 = (1 + Math.random() * 3).toFixed(2);
  const pm10 = (2 + Math.random() * 4).toFixed(1);

  iotPanel.innerHTML = `
        <h3 style="font-size: 14px; margin-bottom: 8px; margin-top: 0;">THIẾT BỊ ĐO</h3>
        <div style="font-size: 12px; margin-bottom: 4px;">Nhiệt độ: ${temp}°</div>
        <div style="font-size: 12px; margin-bottom: 4px;">Độ ẩm: ${humidity}%</div>
        <div style="font-size: 12px; margin-bottom: 4px;">PM2.5: ${pm25} μg</div>
        <div style="font-size: 12px; margin-bottom: 4px;">PM10: ${pm10} μg</div>
        <div style="font-size: 10px; background-color: green; padding: 2px 6px; border-radius: 3px; margin-top: 5px;">
            TỐT
        </div>
    `;
}

/**
 * Refresh all data
 */
function refreshAllData() {
  console.log("Refreshing all data...");
  updateIoTData();
  showAlert("All data refreshed!");
}

// Export functions to be able to use in console for testing
window.billboardApp = {
  updateIoTData,
  refreshAllData,
  showAlert,
};
