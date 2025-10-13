// config.js - Configuration Interface Logic
class BillboardConfigManager {
  constructor() {
    this.config = {
      logoMode: "fixed",
      logoImages: [],
      logoLoopDuration: 5,
      layoutPositions: {
        weather: { x: 0, y: 0, width: 192, height: 288 },
        iot: { x: 192, y: 0, width: 192, height: 288 },
        logo: { x: 0, y: 288, width: 384, height: 96 },
      },
      schedules: [],
    };

    // Initialize authentication service
    this.authService = null;
    this.initAuthService();

    this.init();
  }

  async initAuthService() {
    try {
      console.log("ConfigManager: Initializing auth service...");

      // Check if EraAuthService is available (should be loaded from HTML script tag)
      if (!window.EraAuthService) {
        console.error(
          "ConfigManager: EraAuthService not found on window object"
        );
        return;
      }

      this.authService = new window.EraAuthService();

      // Subscribe to auth state changes
      this.authService.onAuthStateChange((authState) => {
        console.log("ConfigManager: Auth state changed:", authState);
        this.updateLoginUI(authState);
      });

      // Initialize login UI with current auth state
      const currentState = this.authService.getAuthState();
      console.log("ConfigManager: Current auth state:", currentState);
      this.updateLoginUI(currentState);

      console.log("ConfigManager: Auth service initialized successfully");
    } catch (error) {
      console.error("ConfigManager: Failed to initialize auth service:", error);
    }
  }

  init() {
    this.setupTabNavigation();
    this.setupLogoModeHandlers();
    this.setupLoginHandlers();
    this.loadConfiguration();
    this.setupDragAndDrop();
  }

  setupLoginHandlers() {
    const loginForm = document.getElementById("era-login-form");
    const logoutBtn = document.getElementById("logout-btn");
    const copyTokenBtn = document.getElementById("copy-token-btn");

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.handleLogout();
      });
    }

    if (copyTokenBtn) {
      copyTokenBtn.addEventListener("click", () => {
        this.copyTokenToClipboard();
      });
    }
  }

  async handleLogin() {
    if (!this.authService) {
      this.showNotification("Authentication service not available", "error");
      return;
    }

    const usernameInput = document.getElementById("era-username");
    const passwordInput = document.getElementById("era-password");
    const loginBtn = document.getElementById("login-btn");
    const btnText = loginBtn.querySelector(".btn-text");
    const btnLoader = loginBtn.querySelector(".btn-loader");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      this.showNotification("Please enter both username and password", "error");
      return;
    }

    // Show loading state
    loginBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline";

    try {
      const result = await this.authService.login({ username, password });

      if (result.success) {
        this.showNotification("Login successful!", "success");

        // Update E-Ra IoT configuration with new token
        await this.updateEraIotConfig(result.token);

        // Clear password field
        passwordInput.value = "";
      } else {
        this.showNotification(result.message || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification("Login failed: " + error.message, "error");
    } finally {
      // Reset button state
      loginBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoader.style.display = "none";
    }
  }

  handleLogout() {
    if (!this.authService) {
      return;
    }

    this.authService.logout();
    this.showNotification("Logged out successfully", "success");

    // Clear form fields
    document.getElementById("era-username").value = "";
    document.getElementById("era-password").value = "";
  }

  updateLoginUI(authState) {
    const statusIndicator = document.getElementById("status-indicator");
    const statusText = statusIndicator?.querySelector(".status-text");
    const loginForm = document.getElementById("era-login-form");
    const logoutBtn = document.getElementById("logout-btn");
    const tokenInfo = document.getElementById("token-info");
    const tokenDisplay = document.getElementById("token-display");

    if (!statusIndicator || !statusText) return;

    if (authState.isAuthenticated) {
      // Logged in state
      statusIndicator.className = "status-indicator online";
      statusText.textContent = `Logged in as ${
        authState.user?.username || "User"
      }`;

      if (loginForm) loginForm.style.display = "none";
      if (logoutBtn) logoutBtn.classList.add("logout-btn-visible");
      if (tokenInfo) tokenInfo.style.display = "block";

      // Update token display
      if (tokenDisplay) {
        const tokenText = tokenDisplay.querySelector(".token-text");
        if (tokenText) {
          tokenText.textContent = authState.token || "Token not available";
        }
      }
    } else {
      // Logged out state
      statusIndicator.className = "status-indicator offline";
      statusText.textContent = "Not logged in";

      if (loginForm) loginForm.style.display = "block";
      if (logoutBtn) logoutBtn.classList.remove("logout-btn-visible");
      if (tokenInfo) tokenInfo.style.display = "none";
    }
  }

  async updateEraIotConfig(token) {
    try {
      const gatewayToken = this.authService.extractGatewayToken(token);

      if (!gatewayToken) {
        console.error("Failed to extract gateway token");
        return;
      }

      // Update authentication token via IPC
      if (window.electronAPI) {
        const result = await window.electronAPI.updateAuthToken(token);
        if (result.success) {
          console.log("Authentication token saved successfully");
        } else {
          console.error("Failed to save authentication token:", result.error);
        }
      }

      // Update local config for immediate use
      if (!this.config.eraIot) {
        this.config.eraIot = {
          enabled: true,
          baseUrl: "https://backend.eoh.io",
          sensorConfigs: {
            temperature: 138997,
            humidity: 138998,
            pm25: 138999,
            pm10: 139000,
          },
          updateInterval: 5,
          timeout: 15000,
          retryAttempts: 3,
          retryDelay: 2000,
        };
      }

      this.config.eraIot.authToken = token;

      console.log("E-Ra IoT configuration updated with new token");
    } catch (error) {
      console.error("Failed to update E-Ra IoT config:", error);
    }
  }

  copyTokenToClipboard() {
    if (!this.authService) return;

    const token = this.authService.getToken();
    if (!token) {
      this.showNotification("No token available to copy", "error");
      return;
    }

    navigator.clipboard
      .writeText(token)
      .then(() => {
        this.showNotification("Token copied to clipboard", "success");
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = token;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        this.showNotification("Token copied to clipboard", "success");
      });
  }

  setupTabNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    const tabContents = document.querySelectorAll(".tab-content");

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        // Remove active class from all links and tabs
        navLinks.forEach((l) => l.classList.remove("active"));
        tabContents.forEach((t) => t.classList.remove("active"));

        // Add active class to clicked link
        link.classList.add("active");

        // Show corresponding tab content
        const tabId = link.getAttribute("data-tab");
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add("active");
        }
      });
    });
  }

  setupLogoModeHandlers() {
    const radioButtons = document.querySelectorAll('input[name="logoMode"]');
    const loopSettings = document.getElementById("loop-settings");
    const scheduleSettings = document.getElementById("schedule-settings");

    radioButtons.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const mode = e.target.value;
        this.config.logoMode = mode;

        // Show/hide relevant settings
        loopSettings.style.display = mode === "loop" ? "block" : "none";
        scheduleSettings.style.display =
          mode === "scheduled" ? "block" : "none";
      });
    });

    // Loop duration handler
    const loopDurationInput = document.getElementById("loop-duration");
    loopDurationInput.addEventListener("change", (e) => {
      this.config.logoLoopDuration = parseInt(e.target.value);
    });
  }

  async loadConfiguration() {
    try {
      if (window.electronAPI) {
        const savedConfig = await window.electronAPI.getConfig();
        this.config = { ...this.config, ...savedConfig };
        this.updateUI();
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
  }

  updateUI() {
    // Update logo mode radio buttons
    const modeRadio = document.querySelector(
      `input[value="${this.config.logoMode}"]`
    );
    if (modeRadio) {
      modeRadio.checked = true;
      modeRadio.dispatchEvent(new Event("change"));
    }

    // Update loop duration
    const loopDurationInput = document.getElementById("loop-duration");
    loopDurationInput.value = this.config.logoLoopDuration;

    // Update logo grid
    this.renderLogoGrid();
  }

  renderLogoGrid() {
    const logoGrid = document.getElementById("logo-grid");
    logoGrid.innerHTML = "";

    this.config.logoImages.forEach((logo, index) => {
      const logoItem = document.createElement("div");
      logoItem.className = "logo-item";
      logoItem.innerHTML = `
                <img src="${logo.path}" alt="${logo.name}" />
                <p style="font-size: 12px; margin-top: 5px; word-break: break-all;">${logo.name}</p>
                <button class="remove-btn" onclick="configManager.removeLogo(${index})">×</button>
            `;
      logoGrid.appendChild(logoItem);
    });
  }

  addLogo(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const logo = {
        name: file.name,
        path: e.target.result,
        size: file.size,
        type: file.type,
      };

      this.config.logoImages.push(logo);
      this.renderLogoGrid();
    };
    reader.readAsDataURL(file);
  }

  removeLogo(index) {
    this.config.logoImages.splice(index, 1);
    this.renderLogoGrid();
  }

  setupDragAndDrop() {
    const uploadArea = document.querySelector(".logo-upload-area");

    // Handle drag and drop
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#e55a2b";
      uploadArea.style.background = "#ffede6";
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#ff6b35";
      uploadArea.style.background = "#fff5f2";
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#ff6b35";
      uploadArea.style.background = "#fff5f2";

      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          this.addLogo(file);
        }
      });
    });
  }

  addScheduleRule() {
    const scheduleRules = document.getElementById("schedule-rules");
    const ruleIndex = this.config.schedules.length;

    const ruleDiv = document.createElement("div");
    ruleDiv.className = "schedule-rule";
    ruleDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 10px;
        `;

    ruleDiv.innerHTML = `
            <div style="flex: 1;">
                <label style="display: block; font-size: 14px; color: #6c757d; margin-bottom: 5px;">Time</label>
                <input type="time" class="form-control" style="width: 120px;" 
                       onchange="configManager.updateScheduleRule(${ruleIndex}, 'time', this.value)">
            </div>
            <div style="flex: 1;">
                <label style="display: block; font-size: 14px; color: #6c757d; margin-bottom: 5px;">Logo</label>
                <select class="form-control" 
                        onchange="configManager.updateScheduleRule(${ruleIndex}, 'logoIndex', this.value)">
                    <option value="">Select Logo</option>
                    ${this.config.logoImages
                      .map(
                        (logo, idx) =>
                          `<option value="${idx}">${logo.name}</option>`
                      )
                      .join("")}
                </select>
            </div>
            <div style="flex: 1;">
                <label style="display: block; font-size: 14px; color: #6c757d; margin-bottom: 5px;">Days</label>
                <select class="form-control" 
                        onchange="configManager.updateScheduleRule(${ruleIndex}, 'days', this.value)">
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <button class="btn btn-secondary" style="height: 40px; width: 40px; padding: 0;" 
                    onclick="configManager.removeScheduleRule(${ruleIndex})">×</button>
        `;

    scheduleRules.appendChild(ruleDiv);

    // Add empty rule to config
    this.config.schedules.push({
      time: "",
      logoIndex: null,
      days: "daily",
    });
  }

  updateScheduleRule(index, field, value) {
    if (this.config.schedules[index]) {
      this.config.schedules[index][field] = value;
    }
  }

  removeScheduleRule(index) {
    this.config.schedules.splice(index, 1);
    this.renderScheduleRules();
  }

  renderScheduleRules() {
    const scheduleRules = document.getElementById("schedule-rules");
    scheduleRules.innerHTML = "";
    this.config.schedules.forEach((rule, index) => {
      this.addScheduleRule();
    });
  }

  async saveConfiguration() {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.saveConfig(this.config);
        if (result.success) {
          this.showNotification("Configuration saved successfully!", "success");
        } else {
          this.showNotification("Failed to save configuration", "error");
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      this.showNotification("Error saving configuration", "error");
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            ${
              type === "success"
                ? "background: #28a745;"
                : type === "error"
                ? "background: #dc3545;"
                : "background: #007bff;"
            }
        `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Global functions for HTML onclick handlers
async function selectLogoFiles() {
  if (window.electronAPI) {
    try {
      const filePaths = await window.electronAPI.selectLogoFiles();
      if (filePaths && filePaths.length > 0) {
        filePaths.forEach((filePath) => {
          const fileName = filePath.split("\\").pop().split("/").pop();
          const logo = {
            name: fileName,
            path: filePath,
            size: 0,
            type: "image/*",
          };
          configManager.config.logoImages.push(logo);
        });
        configManager.renderLogoGrid();
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    }
  } else {
    // Fallback for web environment
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";

    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        configManager.addLogo(file);
      });
    };

    input.click();
  }
}

function addScheduleRule() {
  configManager.addScheduleRule();
}

async function saveAndApply() {
  console.log("Saving configuration...", configManager.config);
  await configManager.saveConfiguration();

  // Show success message
  configManager.showNotification(
    "Configuration saved and applied successfully!",
    "success"
  );

  // Log current config for debugging
  console.log("Configuration applied:", configManager.config);

  // Optional: Close config window after save (uncomment if desired)
  // setTimeout(() => {
  //   exitConfig();
  // }, 1000);
}

async function exitConfig() {
  if (window.electronAPI) {
    await window.electronAPI.exitConfig();
  }
}

// Initialize configuration manager when DOM is loaded
let configManager;
document.addEventListener("DOMContentLoaded", () => {
  configManager = new BillboardConfigManager();

  // Add CSS animation for notifications
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .hidden {
            display: none !important;
        }
        
        .schedule-rule {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 10px;
        }
    `;
  document.head.appendChild(style);
});
