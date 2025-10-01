// main.js - Electron Main Process
// Manages main window and application lifecycle

const { app, BrowserWindow } = require("electron");
const path = require("path");

// Global variable to store main window reference
let mainWindow;

/**
 * Create main application window
 * Fixed size: 384x384 pixels (corresponding to LED screen)
 */
function createWindow() {
  // Create window with configuration for outdoor LED screen
  mainWindow = new BrowserWindow({
    width: 384, // Fixed width
    height: 384, // Fixed height
    frame: false, // No window border (fullscreen appearance)
    resizable: false, // Don't allow resize
    alwaysOnTop: true, // Always display on top
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, "assets/icon.png"), // Application icon (optional)
  });

  // Load main HTML file
  mainWindow.loadFile("renderer/index.html");

  // Enable DevTools for development (can be disabled in production)
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  // Handle when window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Launch application when Electron is ready
app.whenReady().then(createWindow);

// Quit application when all windows are closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Recreate window when clicking dock icon (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
