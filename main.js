// main.js - Electron Main Process
// Manages main window and application lifecycle

const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");

// Global variables
let mainWindow;
let configWindow;
let isConfigMode = false;

/**
 * Create main billboard display window
 * Fixed size: 384x384 pixels (corresponding to LED screen)
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 384,
    height: 384,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    show: false, // Don't show initially
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
      devTools: process.argv.includes("--dev"),
    },
    icon: path.join(__dirname, "assets/icon.png"),
  });

  mainWindow.loadFile("renderer/index.html");

  // Forward console logs to main process in dev mode
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.on(
      "console-message",
      (event, level, message, line, sourceId) => {
        console.log(`[Renderer] ${message}`);
      }
    );
  }

  mainWindow.once("ready-to-show", () => {
    if (!isConfigMode) {
      mainWindow.show();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Create configuration window
 * Full screen config interface
 */
function createConfigWindow() {
  if (configWindow) {
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true,
    resizable: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.png"),
  });

  configWindow.loadFile("renderer/config.html");

  configWindow.once("ready-to-show", () => {
    configWindow.show();
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  configWindow.on("closed", () => {
    configWindow = null;
    isConfigMode = false;
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

/**
 * Toggle between main display and config mode
 */
function toggleConfigMode() {
  console.log("F1 pressed - Toggling config mode");

  if (!isConfigMode) {
    // Enter config mode
    isConfigMode = true;
    createConfigWindow();
  } else {
    // Exit config mode
    if (configWindow) {
      configWindow.close();
    }
  }
}

// Launch application when Electron is ready
app.whenReady().then(() => {
  createMainWindow();

  // Register global F1 shortcut for config mode
  globalShortcut.register("F1", () => {
    toggleConfigMode();
  });

  console.log("Billboard app started - Press F1 for config mode");
});

// Quit application when all windows are closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Recreate window when clicking dock icon (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Cleanup shortcuts on quit
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// IPC handlers for config communication
const fs = require("fs");
const { dialog } = require("electron");

// Configuration file path
const configPath = path.join(__dirname, "config.json");

/**
 * Broadcast configuration updates to all active windows
 */
function broadcastConfigUpdate(config) {
  console.log("Broadcasting config update to all windows");

  // Send to main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log("Sending config-updated to main window");
    mainWindow.webContents.send("config-updated", config);
    mainWindow.webContents.send("force-refresh-services", config);
  }

  // Send to config window if open
  if (configWindow && !configWindow.isDestroyed()) {
    console.log("Sending config-updated to config window");
    configWindow.webContents.send("config-updated", config);
  }

  // Send specific E-Ra IoT updates if applicable
  if (config.eraIot) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("era-iot-config-updated", config.eraIot);
    }
  }
}

ipcMain.handle("get-config", async () => {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, "utf8");
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error("Error loading config:", error);
  }

  // Return default configuration
  return {
    logoMode: "fixed",
    logoImages: [],
    logoLoopDuration: 5,
    layoutPositions: {
      weather: { x: 0, y: 0, width: 192, height: 288 },
      iot: { x: 192, y: 0, width: 192, height: 288 },
      logo: { x: 0, y: 288, width: 384, height: 96 },
    },
    schedules: [],
    eraIot: {
      enabled: false,
      authToken: "",
      baseUrl: "https://backend.eoh.io",
      sensorConfigs: {
        temperature: null,
        humidity: null,
        pm25: null,
        pm10: null,
      },
      updateInterval: 5,
      timeout: 15000,
      retryAttempts: 3,
      retryDelay: 2000,
    },
  };
});

ipcMain.handle("save-config", async (event, config) => {
  try {
    // Ensure E-Ra IoT config is preserved
    let currentConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, "utf8");
        currentConfig = JSON.parse(configData);
      } catch (error) {
        console.warn("Could not load existing config, using defaults");
      }
    }

    // Merge E-Ra IoT config if provided
    const mergedConfig = {
      ...currentConfig,
      ...config,
    };

    if (config.eraIot) {
      mergedConfig.eraIot = {
        ...currentConfig.eraIot,
        ...config.eraIot,
      };
    }

    fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
    console.log("Configuration saved successfully");

    // Broadcast config update to all windows for hot-reload
    broadcastConfigUpdate(mergedConfig);

    return { success: true };
  } catch (error) {
    console.error("Error saving config:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("exit-config", async () => {
  if (configWindow) {
    configWindow.close();
  }
});

ipcMain.handle("select-logo-files", async () => {
  try {
    const result = await dialog.showOpenDialog(configWindow, {
      title: "Select Logo Images",
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "svg", "gif"] },
      ],
      properties: ["openFile", "multiSelections"],
    });

    if (!result.canceled) {
      return result.filePaths;
    }
    return [];
  } catch (error) {
    console.error("Error selecting files:", error);
    return [];
  }
});

ipcMain.handle("minimize-app", async () => {
  if (configWindow) {
    configWindow.minimize();
  }
});

ipcMain.handle("close-app", async () => {
  app.quit();
});

// E-Ra IoT specific configuration handler
ipcMain.handle("update-era-iot-config", async (event, eraIotConfig) => {
  try {
    let currentConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, "utf8");
        currentConfig = JSON.parse(configData);
      } catch (error) {
        console.warn("Could not load existing config, using defaults");
      }
    }

    // Update E-Ra IoT configuration
    currentConfig.eraIot = {
      ...currentConfig.eraIot,
      ...eraIotConfig,
    };

    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
    console.log("E-Ra IoT configuration updated successfully");

    // Broadcast config update to all windows
    broadcastConfigUpdate(currentConfig);

    return { success: true };
  } catch (error) {
    console.error("Error updating E-Ra IoT config:", error);
    return { success: false, error: error.message };
  }
});

// Handle authentication token updates from login
ipcMain.handle("update-auth-token", async (event, authToken) => {
  try {
    let currentConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, "utf8");
        currentConfig = JSON.parse(configData);
      } catch (error) {
        console.warn("Could not load existing config, using defaults");
      }
    }

    // Ensure E-Ra IoT config exists
    if (!currentConfig.eraIot) {
      currentConfig.eraIot = {
        enabled: true,
        baseUrl: "https://backend.eoh.io",
        sensorConfigs: {
          temperature: null,
          humidity: null,
          pm25: null,
          pm10: null,
        },
        updateInterval: 5,
        timeout: 15000,
        retryAttempts: 3,
        retryDelay: 2000,
      };
    }

    // Update auth token
    currentConfig.eraIot.authToken = authToken;

    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
    console.log("Authentication token updated successfully");

    // Broadcast config update to all windows
    broadcastConfigUpdate(currentConfig);

    return { success: true };
  } catch (error) {
    console.error("Error updating auth token:", error);
    return { success: false, error: error.message };
  }
});
