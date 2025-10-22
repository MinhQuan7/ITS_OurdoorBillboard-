// main.js - Electron Main Process
// Manages main window and application lifecycle

const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const mqtt = require("mqtt");

// Global variables
let mainWindow;
let configWindow;
let isConfigMode = false;

// MQTT Service for E-Ra IoT Integration
let mqttService = null;
let currentSensorData = {
  temperature: null,
  humidity: null,
  pm25: null,
  pm10: null,
  lastUpdated: null,
  status: "offline",
};

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

    // Add a delay to ensure the window is fully loaded before accepting config updates
    setTimeout(() => {
      console.log("Main window is fully ready for config updates");
      mainWindow.isConfigReady = true;
    }, 1000);
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
app.whenReady().then(async () => {
  createMainWindow();

  // Setup config file watcher for hot-reload
  setupConfigWatcher();

  // Initialize MQTT service
  await initializeMqttService();

  // Register global F1 shortcut for config mode
  globalShortcut.register("F1", () => {
    toggleConfigMode();
  });

  console.log("Billboard app started - Press F1 for config mode");
  console.log("Config hot-reload watcher active");
  console.log("MQTT service initialized");
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

// Cleanup shortcuts and watchers on quit
app.on("will-quit", () => {
  globalShortcut.unregisterAll();

  if (configWatcher) {
    fs.unwatchFile(configPath);
    configWatcher = null;
    console.log("Config watcher cleaned up");
  }

  if (mqttService) {
    mqttService.disconnect();
    mqttService = null;
    console.log("MQTT service cleaned up");
  }
});

// IPC handlers for config communication
const fs = require("fs");
const { dialog } = require("electron");

// Configuration file path
const configPath = path.join(__dirname, "config.json");

// File system watcher for config.json hot-reload
let configWatcher = null;

function setupConfigWatcher() {
  if (configWatcher) {
    configWatcher.close();
  }

  try {
    configWatcher = fs.watchFile(configPath, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        console.log("Config file changed externally, triggering hot-reload...");

        try {
          const configData = fs.readFileSync(configPath, "utf8");
          const config = JSON.parse(configData);

          console.log("External config change detected:", {
            logoMode: config.logoMode,
            logoLoopDuration: config.logoLoopDuration,
            logoImages: config.logoImages?.length,
          });

          // Broadcast the updated config
          broadcastConfigUpdate(config);
        } catch (error) {
          console.error("Error parsing externally changed config:", error);
        }
      }
    });

    console.log("Config file watcher established for hot-reload");
  } catch (error) {
    console.error("Failed to setup config watcher:", error);
  }
}

/**
 * Broadcast configuration updates to all active windows
 */
function broadcastConfigUpdate(config) {
  console.log("Broadcasting config update to all windows", {
    logoMode: config.logoMode,
    logoLoopDuration: config.logoLoopDuration,
    logoImages: config.logoImages?.length,
    hasEraIot: !!config.eraIot,
    timestamp: new Date().toLocaleTimeString(),
  });

  // Send to main window with immediate effect
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.webContents.isLoading() === false
  ) {
    console.log("Sending IMMEDIATE config-updated to main window");

    // Send main config update
    mainWindow.webContents.send("config-updated", config);

    // Send force refresh
    mainWindow.webContents.send("force-refresh-services", config);

    // Force reload for logo changes specifically - send multiple times to ensure delivery
    if (config.logoMode && config.logoLoopDuration) {
      console.log(
        `Forcing logo loop interval update: ${config.logoLoopDuration}s`
      );

      // Send immediately
      mainWindow.webContents.send("logo-config-updated", {
        logoMode: config.logoMode,
        logoLoopDuration: config.logoLoopDuration,
        logoImages: config.logoImages,
      });

      // Send with delay to ensure delivery
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("logo-config-updated", {
            logoMode: config.logoMode,
            logoLoopDuration: config.logoLoopDuration,
            logoImages: config.logoImages,
          });
          console.log("DELAYED logo-config-updated event sent");
        }
      }, 100);

      // Send another one with longer delay
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("config-updated", config);
          console.log("FINAL config-updated event sent");
        }
      }, 200);
    }
  } else {
    console.log(
      "Main window not available for config broadcast - Window loading:",
      mainWindow?.webContents.isLoading()
    );
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

    // Restart MQTT service with new config
    console.log("Restarting MQTT service due to config change...");
    setTimeout(async () => {
      await initializeMqttService();
    }, 500);
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

    // IMMEDIATELY broadcast config update to all windows for instant effect (not waiting for file watcher)
    console.log("IMMEDIATE CONFIG BROADCAST after save");
    broadcastConfigUpdate(mergedConfig);

    // Also send with delay to ensure delivery
    setTimeout(() => {
      console.log("DELAYED CONFIG BROADCAST after save");
      broadcastConfigUpdate(mergedConfig);
    }, 150);

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

// Provide parsed gateway token to renderer on demand
ipcMain.handle("get-gateway-token", async () => {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, "utf8");
      const cfg = JSON.parse(configData);
      const auth = cfg?.eraIot?.authToken || "";
      const match = auth.match(/Token\s+(.+)/);
      return match ? match[1] : null;
    }
  } catch (error) {
    console.error("get-gateway-token: failed to read config:", error);
  }
  return null;
});

/**
 * MQTT Service for E-Ra IoT Integration (Main Process)
 * Handles MQTT connection and data processing in Node.js environment
 */
class MainProcessMqttService {
  constructor() {
    this.client = null;
    this.config = null;
    this.isConnected = false;
    this.connectionTimer = null;
    this.updateTimer = null;
  }

  async initialize(eraIotConfig) {
    if (!eraIotConfig || !eraIotConfig.enabled || !eraIotConfig.authToken) {
      console.log(
        "MainProcessMqttService: E-Ra IoT not configured or disabled"
      );
      return false;
    }

    this.config = eraIotConfig;

    // Extract gateway token
    const gatewayToken = this.extractGatewayToken(eraIotConfig.authToken);
    if (!gatewayToken) {
      console.error("MainProcessMqttService: Could not extract gateway token");
      return false;
    }

    this.gatewayToken = gatewayToken;
    console.log(
      "MainProcessMqttService: Initializing with gateway token:",
      gatewayToken.substring(0, 10) + "..."
    );

    await this.connectMQTT();
    return true;
  }

  extractGatewayToken(authToken) {
    const tokenMatch = authToken.match(/Token\s+(.+)/);
    return tokenMatch ? tokenMatch[1] : null;
  }

  async connectMQTT() {
    if (this.client) {
      console.warn("MainProcessMqttService: Already connected or connecting");
      return;
    }

    try {
      const brokerUrl = "mqtt://mqtt1.eoh.io:1883";

      console.log("MainProcessMqttService: E-Ra MQTT Configuration");
      console.log("MainProcessMqttService: ============================");
      console.log("MainProcessMqttService: Broker: mqtt1.eoh.io:1883");
      console.log(
        "MainProcessMqttService: Username:",
        this.gatewayToken.substring(0, 10) + "..."
      );
      console.log(
        "MainProcessMqttService: Password:",
        this.gatewayToken.substring(0, 10) + "..."
      );
      console.log(
        "MainProcessMqttService: Topic:",
        `eoh/chip/${this.gatewayToken}/config/+/value`
      );
      console.log(
        "MainProcessMqttService: Sensor configs:",
        this.config.sensorConfigs
      );

      console.log("MainProcessMqttService: Connecting to E-Ra MQTT broker...");

      this.client = mqtt.connect(brokerUrl, {
        username: this.gatewayToken,
        password: this.gatewayToken,
        clientId: `billboard_${this.gatewayToken}_${Date.now()}`,
        keepalive: 60,
        connectTimeout: 15000,
        clean: true,
      });

      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        console.log("MainProcessMqttService: ❌ Connection timeout");
        this.client.end();
        this.updateConnectionStatus("timeout");
      }, 20000);

      this.client.on("connect", () => {
        clearTimeout(this.connectionTimer);
        console.log(
          "MainProcessMqttService: ✅ Successfully connected to E-Ra MQTT broker!"
        );
        this.isConnected = true;
        this.subscribeToTopics();
        this.startPeriodicUpdates();
        this.updateConnectionStatus("connected");
      });

      this.client.on("message", (topic, message) => {
        this.handleMqttMessage(topic, message);
      });

      this.client.on("error", (error) => {
        clearTimeout(this.connectionTimer);
        console.log(
          "MainProcessMqttService: ❌ Connection error:",
          error.message
        );
        this.client.end();
        this.updateConnectionStatus("error", error.message);
      });

      this.client.on("close", () => {
        console.log("MainProcessMqttService: Connection closed");
        this.isConnected = false;
        this.updateConnectionStatus("offline");
      });
    } catch (error) {
      console.error("MainProcessMqttService: Failed to connect:", error);
      this.updateConnectionStatus("error", error.message);
    }
  }

  subscribeToTopics() {
    if (!this.client || !this.client.connected) {
      console.warn(
        "MainProcessMqttService: Cannot subscribe - client not connected"
      );
      return;
    }

    const testTopic = `eoh/chip/${this.gatewayToken}/config/+/value`;
    this.client.subscribe(testTopic, { qos: 1 }, (err) => {
      if (err) {
        console.log(
          "MainProcessMqttService: ❌ Failed to subscribe:",
          err.message
        );
      } else {
        console.log(
          "MainProcessMqttService: ✅ Successfully subscribed to:",
          testTopic
        );
        console.log("MainProcessMqttService: Waiting for messages...");
      }
    });
  }

  handleMqttMessage(topic, message) {
    try {
      const messageStr = message.toString();
      console.log(
        `MainProcessMqttService: [${new Date().toLocaleTimeString()}] ${topic}: ${messageStr}`
      );

      // Parse E-RA message
      let value = null;
      try {
        const data = JSON.parse(messageStr);
        console.log("MainProcessMqttService: Parsed JSON:", data);

        // Extract value from various possible formats
        if (typeof data === "object" && data !== null) {
          const keys = Object.keys(data);
          if (keys.length === 1) {
            const key = keys[0];
            const potentialValue = data[key];
            if (typeof potentialValue === "string") {
              value = this.parseEraValue(potentialValue);
            } else if (
              typeof potentialValue === "number" &&
              !isNaN(potentialValue)
            ) {
              value = potentialValue;
            }
          }
        }
      } catch (error) {
        // Try parsing as number
        const numValue = parseFloat(messageStr);
        if (!isNaN(numValue)) {
          value = numValue;
          console.log(`MainProcessMqttService: Parsed as number: ${numValue}`);
        }
      }

      if (value !== null && !isNaN(value)) {
        // Extract config ID from topic
        const configIdMatch = topic.match(/\/config\/(\d+)\/value$/);
        if (configIdMatch) {
          const configId = parseInt(configIdMatch[1]);
          this.updateSensorData(configId, value);
        }
      }
    } catch (error) {
      console.error("MainProcessMqttService: Error processing message:", error);
    }
  }

  parseEraValue(valueStr) {
    try {
      // Handle "+" prefix in E-RA values
      if (valueStr.includes("+")) {
        const withoutPlus = valueStr.replace("+", "");
        const parsed = parseFloat(withoutPlus);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }

      const directParse = parseFloat(valueStr);
      if (!isNaN(directParse)) {
        return directParse;
      }

      return null;
    } catch (error) {
      console.error(
        `MainProcessMqttService: Error parsing value "${valueStr}":`,
        error
      );
      return null;
    }
  }

  updateSensorData(configId, value) {
    const sensorType = this.mapConfigIdToSensorType(configId);
    if (sensorType) {
      console.log(
        `MainProcessMqttService: Updating ${sensorType} (ID: ${configId}) = ${value}`
      );

      currentSensorData[sensorType] = value;
      currentSensorData.lastUpdated = new Date();
      currentSensorData.status = "connected";

      // Send data to renderer process
      this.broadcastSensorData();
    } else {
      console.warn(`MainProcessMqttService: Unknown config ID: ${configId}`);
    }
  }

  mapConfigIdToSensorType(configId) {
    if (this.config.sensorConfigs.temperature === configId)
      return "temperature";
    if (this.config.sensorConfigs.humidity === configId) return "humidity";
    if (this.config.sensorConfigs.pm25 === configId) return "pm25";
    if (this.config.sensorConfigs.pm10 === configId) return "pm10";
    return null;
  }

  startPeriodicUpdates() {
    // Send current data every second to keep UI updated
    this.updateTimer = setInterval(() => {
      if (this.isConnected) {
        this.broadcastSensorData();
      }
    }, 1000);
    console.log(
      "MainProcessMqttService: Started periodic data updates every 1 second"
    );
  }

  broadcastSensorData() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("era-iot-data-update", currentSensorData);
    }
  }

  updateConnectionStatus(status, message = null) {
    currentSensorData.status = status;
    if (message) {
      currentSensorData.errorMessage = message;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("era-iot-status-update", {
        status,
        message,
        lastUpdated: currentSensorData.lastUpdated,
      });
    }
  }

  disconnect() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    if (this.client) {
      this.client.end();
      this.client = null;
    }

    this.isConnected = false;
    console.log("MainProcessMqttService: Disconnected");
  }
}

// Initialize MQTT service when config is loaded
async function initializeMqttService() {
  try {
    // Read config directly from file (not via IPC in main process)
    let config = null;
    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf8");
        config = JSON.parse(configData);
      }
    } catch (error) {
      console.error("Error reading config for MQTT initialization:", error);
      return;
    }

    if (config && config.eraIot && config.eraIot.enabled) {
      console.log("Initializing MQTT service with E-Ra IoT config");

      if (mqttService) {
        mqttService.disconnect();
      }

      mqttService = new MainProcessMqttService();
      await mqttService.initialize(config.eraIot);
    } else {
      console.log("E-Ra IoT not configured or disabled");
    }
  } catch (error) {
    console.error("Failed to initialize MQTT service:", error);
  }
}

// IPC handlers for MQTT data
ipcMain.handle("get-era-iot-data", async () => {
  return currentSensorData;
});

ipcMain.handle("refresh-era-iot-connection", async () => {
  if (mqttService) {
    console.log("Refreshing E-Ra IoT MQTT connection...");
    mqttService.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    await initializeMqttService();
    return { success: true };
  }
  return { success: false, message: "MQTT service not initialized" };
});
