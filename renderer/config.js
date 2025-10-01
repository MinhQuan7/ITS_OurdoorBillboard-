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

    this.init();
  }

  init() {
    this.setupTabNavigation();
    this.setupLogoModeHandlers();
    this.loadConfiguration();
    this.setupDragAndDrop();
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
                <label style="display: block; font-size: 12px; color: #6c757d; margin-bottom: 5px;">Time</label>
                <input type="time" class="form-control" style="width: 120px;" 
                       onchange="configManager.updateScheduleRule(${ruleIndex}, 'time', this.value)">
            </div>
            <div style="flex: 1;">
                <label style="display: block; font-size: 12px; color: #6c757d; margin-bottom: 5px;">Logo</label>
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
                <label style="display: block; font-size: 12px; color: #6c757d; margin-bottom: 5px;">Days</label>
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
  await configManager.saveConfiguration();
  // Apply configuration to main billboard display
  console.log("Configuration applied");
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
