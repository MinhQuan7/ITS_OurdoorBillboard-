// Billboard Banner Manager Main Script

class BillboardManager {
  constructor() {
    this.currentFile = null;
    this.uploadHistory = JSON.parse(
      localStorage.getItem("banner_history") || "[]"
    );
    this.isConnected = false;

    this.initializeElements();
    this.bindEvents();
    this.loadCurrentBanner();
    this.loadUploadHistory();
    this.checkConnectionStatus();

    // Auto-refresh connection status every 30 seconds
    setInterval(() => this.checkConnectionStatus(), 30000);
  }

  initializeElements() {
    // File input elements
    this.uploadArea = document.getElementById("upload-area");
    this.fileInput = document.getElementById("file-input");
    this.uploadPreview = document.getElementById("upload-preview");
    this.previewImage = document.getElementById("preview-image");

    // Button elements
    this.uploadBtn = document.getElementById("upload-btn");
    this.cancelBtn = document.getElementById("cancel-btn");

    // Progress elements
    this.progressSection = document.getElementById("progress-section");
    this.progressFill = document.getElementById("progress-fill");
    this.progressText = document.getElementById("progress-text");

    // Current banner elements
    this.currentBanner = document.getElementById("current-banner");
    this.bannerFilename = document.getElementById("banner-filename");
    this.bannerTimestamp = document.getElementById("banner-timestamp");

    // Status elements
    this.connectionStatus = document.getElementById("connection-status");
    this.statusText = document.getElementById("status-text");

    // History elements
    this.historyList = document.getElementById("history-list");
  }

  bindEvents() {
    // Upload area events
    this.uploadArea.addEventListener("click", () => this.fileInput.click());
    this.uploadArea.addEventListener(
      "dragover",
      this.handleDragOver.bind(this)
    );
    this.uploadArea.addEventListener(
      "dragleave",
      this.handleDragLeave.bind(this)
    );
    this.uploadArea.addEventListener("drop", this.handleDrop.bind(this));

    // File input change
    this.fileInput.addEventListener("change", this.handleFileSelect.bind(this));

    // Button events
    this.uploadBtn.addEventListener("click", this.uploadBanner.bind(this));
    this.cancelBtn.addEventListener("click", this.cancelUpload.bind(this));
  }

  // Drag & Drop Handlers
  handleDragOver(e) {
    e.preventDefault();
    this.uploadArea.classList.add("dragover");
  }

  handleDragLeave(e) {
    e.preventDefault();
    this.uploadArea.classList.remove("dragover");
  }

  handleDrop(e) {
    e.preventDefault();
    this.uploadArea.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  // File Selection Handler
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  // Process selected file
  async processFile(file) {
    // Validate file
    const validation = Utils.validateFile(file);
    if (!validation.valid) {
      this.showError(validation.errors.join("\n"));
      return;
    }

    this.currentFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImage.src = e.target.result;
      this.showUploadPreview();
    };
    reader.readAsDataURL(file);
  }

  // Show upload preview section
  showUploadPreview() {
    this.uploadArea.style.display = "none";
    this.uploadPreview.style.display = "block";
  }

  // Cancel upload and return to upload area
  cancelUpload() {
    this.currentFile = null;
    this.fileInput.value = "";
    this.uploadPreview.style.display = "none";
    this.uploadArea.style.display = "block";
  }

  // Upload banner to E-Ra platform
  async uploadBanner() {
    if (!this.currentFile) {
      this.showError("No file selected");
      return;
    }

    if (!this.isConnected) {
      this.showError(
        "Not connected to E-Ra platform. Please check connection."
      );
      return;
    }

    try {
      // Show progress
      this.showProgress();
      this.updateProgress(10, "Converting image...");

      // Convert file to Base64
      const base64Data = await Utils.fileToBase64(this.currentFile);
      this.updateProgress(30, "Preparing upload...");

      // Upload to E-Ra platform
      const timestamp = Date.now();
      const filename = this.currentFile.name;

      this.updateProgress(50, "Uploading to E-Ra platform...");
      const success = await eraAPI.uploadBanner(
        base64Data,
        filename,
        timestamp
      );

      if (success) {
        this.updateProgress(100, "Upload completed!");

        // Update current banner display
        this.updateCurrentBanner(base64Data, filename, timestamp);

        // Add to history
        this.addToHistory(filename, timestamp, this.currentFile.size);

        // Reset UI
        setTimeout(() => {
          this.hideProgress();
          this.cancelUpload();
          this.showSuccess("Banner uploaded successfully!");
        }, 1000);
      } else {
        throw new Error("Failed to upload to E-Ra platform");
      }
    } catch (error) {
      console.error("Upload error:", error);
      this.hideProgress();
      this.showError("Upload failed: " + error.message);
    }
  }

  // Load current banner from E-Ra platform
  async loadCurrentBanner() {
    try {
      const bannerInfo = await eraAPI.getCurrentBanner();
      if (bannerInfo && bannerInfo.data) {
        this.updateCurrentBanner(
          bannerInfo.data,
          bannerInfo.filename || "Unknown",
          bannerInfo.timestamp || Date.now()
        );
      }
    } catch (error) {
      console.error("Failed to load current banner:", error);
    }
  }

  // Update current banner display
  updateCurrentBanner(base64Data, filename, timestamp) {
    const imageUrl = Utils.base64ToBlobURL(base64Data);
    this.currentBanner.src = imageUrl;
    this.bannerFilename.textContent = filename;
    this.bannerTimestamp.textContent =
      "Updated: " + Utils.formatTimestamp(timestamp);
  }

  // Check connection status to E-Ra platform
  async checkConnectionStatus() {
    try {
      await eraAPI.getDeviceStatus();
      this.updateConnectionStatus(true);
    } catch (error) {
      this.updateConnectionStatus(false);
    }
  }

  // Update connection status UI
  updateConnectionStatus(connected) {
    this.isConnected = connected;

    if (connected) {
      this.connectionStatus.className = "status online";
      this.statusText.textContent = "Connected to E-Ra";
    } else {
      this.connectionStatus.className = "status offline";
      this.statusText.textContent = "Connection failed";
    }
  }

  // Progress Management
  showProgress() {
    this.uploadPreview.style.display = "none";
    this.progressSection.style.display = "block";
  }

  hideProgress() {
    this.progressSection.style.display = "none";
  }

  updateProgress(percent, text) {
    this.progressFill.style.width = percent + "%";
    this.progressText.textContent = text + ` ${percent}%`;
  }

  // History Management
  addToHistory(filename, timestamp, fileSize) {
    const historyItem = {
      filename: filename,
      timestamp: timestamp,
      fileSize: fileSize,
    };

    this.uploadHistory.unshift(historyItem);

    // Keep only last 10 items
    if (this.uploadHistory.length > 10) {
      this.uploadHistory = this.uploadHistory.slice(0, 10);
    }

    // Save to localStorage
    localStorage.setItem("banner_history", JSON.stringify(this.uploadHistory));

    // Update UI
    this.loadUploadHistory();
  }

  loadUploadHistory() {
    this.historyList.innerHTML = "";

    if (this.uploadHistory.length === 0) {
      this.historyList.innerHTML =
        '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 20px;">No upload history</p>';
      return;
    }

    this.uploadHistory.forEach((item) => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      historyItem.innerHTML = `
                <div>
                    <div class="history-filename">${item.filename}</div>
                    <div style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">${Utils.formatFileSize(
                      item.fileSize
                    )}</div>
                </div>
                <div class="history-timestamp">${Utils.formatTimestamp(
                  item.timestamp
                )}</div>
            `;
      this.historyList.appendChild(historyItem);
    });
  }

  // Notification Methods
  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        `;

    if (type === "success") {
      notification.style.background =
        "linear-gradient(135deg, #4ade80, #22c55e)";
    } else {
      notification.style.background =
        "linear-gradient(135deg, #f87171, #ef4444)";
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

// Add CSS animations for notifications
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
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.billboardManager = new BillboardManager();
});
