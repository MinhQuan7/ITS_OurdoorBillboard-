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
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js")
    },
    icon: path.join(__dirname, "assets/icon.png"),
  });

  mainWindow.loadFile("renderer/index.html");

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
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js")
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
  globalShortcut.register('F1', () => {
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
const fs = require('fs');
const { dialog } = require('electron');

// Configuration file path
const configPath = path.join(__dirname, 'config.json');

ipcMain.handle("get-config", async () => {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  
  // Return default configuration
  return {
    logoMode: "fixed",
    logoImages: [],
    logoLoopDuration: 5,
    layoutPositions: {
      weather: { x: 0, y: 0, width: 192, height: 288 },
      iot: { x: 192, y: 0, width: 192, height: 288 },
      logo: { x: 0, y: 288, width: 384, height: 96 }
    },
    schedules: []
  };
});

ipcMain.handle("save-config", async (event, config) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Configuration saved successfully");
    
    // Send config update to main window if it exists
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config-updated', config);
    }
    
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
      title: 'Select Logo Images',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'gif'] }
      ],
      properties: ['openFile', 'multiSelections']
    });
    
    if (!result.canceled) {
      return result.filePaths;
    }
    return [];
  } catch (error) {
    console.error('Error selecting files:', error);
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
