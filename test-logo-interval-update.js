// test-logo-interval-update.js - Test script to change logo interval and verify hot-reload
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "config.json");

function testLogoIntervalUpdate() {
  try {
    // Read current config
    const configData = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configData);

    console.log(
      `Current logo loop duration: ${config.logoLoopDuration} seconds`
    );

    // Change to 10 seconds for testing
    const newDuration = 10;
    config.logoLoopDuration = newDuration;

    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`Updated logo loop duration to: ${newDuration} seconds`);
    console.log(
      "Config saved. If hot-reload is working, the logo should now rotate every 10 seconds."
    );
    console.log(
      "Watch the main application window to verify the change takes effect immediately."
    );
  } catch (error) {
    console.error("Error updating config:", error);
  }
}

testLogoIntervalUpdate();
