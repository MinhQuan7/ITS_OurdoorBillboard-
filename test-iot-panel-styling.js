// test-iot-panel-styling.js
// Quick test để verify IoT panel background color styling

const { app, BrowserWindow } = require("electron");
const path = require("path");

function createTestWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load test HTML với IoT panel
  win.loadFile("renderer/index.html");

  // Open DevTools để inspect element
  win.webContents.openDevTools();

  // Test các trạng thái IoT panel
  win.webContents.on("did-finish-load", () => {
    console.log("✅ Application loaded successfully");
    console.log("🔍 Check IoT panel in DevTools:");
    console.log("   - Loading state: should have blue gradient background");
    console.log("   - Error state: should have red gradient background");
    console.log("   - Offline state: should have gray gradient background");
    console.log("   - Connected state: should have blue gradient background");

    // Inject test script để verify styling
    win.webContents.executeJavaScript(`
      setTimeout(() => {
        const iotPanel = document.querySelector('.iot-panel');
        if (iotPanel) {
          const styles = window.getComputedStyle(iotPanel);
          console.log('IoT Panel detected:');
          console.log('- className:', iotPanel.className);
          console.log('- background:', styles.background);
          console.log('- backgroundColor:', styles.backgroundColor);
          console.log('- backgroundImage:', styles.backgroundImage);
          
          if (styles.background.includes('gradient') || styles.backgroundImage.includes('gradient')) {
            console.log('✅ BACKGROUND GRADIENT DETECTED - Bug fixed!');
          } else {
            console.log('❌ NO GRADIENT - Still has black background bug');
          }
        } else {
          console.log('❌ IoT Panel not found - Check component rendering');
        }
      }, 1000);
    `);
  });

  return win;
}

app.whenReady().then(createTestWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
