// Main Application JavaScript for Banner Management System
class BannerManagementApp {
  constructor() {
    this.selectedFiles = [];
    this.currentBanners = [];
    this.isUploading = false;
    this.firebaseService = window.FirebaseService;
    this.mqttClient = window.MqttClient;

    this.initializeApp();
  }

  // Initialize the application
  async initializeApp() {
    console.log("Initializing Banner Management App...");

    // Setup UI event listeners
    this.setupEventListeners();

    // Initialize services
    await this.initializeServices();

    // Load initial data
    await this.loadInitialData();

    console.log("App initialized successfully");
  }

  // Initialize Firebase and MQTT services
  async initializeServices() {
    try {
      // Initialize Firebase
      console.log("Initializing Firebase service...");
      const firebaseInit = await this.firebaseService.initialize();

      if (firebaseInit) {
        this.showToast("Firebase connected successfully", "success");
      } else {
        this.showToast("Firebase initialization failed", "error");
        return;
      }

      // Initialize MQTT
      console.log("Initializing MQTT client...");
      await this.mqttClient.connect();

      // Setup MQTT status monitoring
      this.mqttClient.onStatusChange((status) => {
        this.updateConnectionStatus(status);
      });

      this.showToast("MQTT connected successfully", "success");
    } catch (error) {
      console.error("Service initialization error:", error);
      this.showToast(
        "Service initialization failed: " + error.message,
        "error"
      );
    }
  }

  // Setup UI event listeners
  setupEventListeners() {
    // File input
    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", (e) => this.handleFileSelect(e));

    // Upload area drag & drop
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.addEventListener("click", () => this.triggerFileSelect());
    uploadArea.addEventListener("dragover", (e) => this.handleDragOver(e));
    uploadArea.addEventListener("dragleave", (e) => this.handleDragLeave(e));
    uploadArea.addEventListener("drop", (e) => this.handleDrop(e));

    // Settings inputs
    const displayMode = document.getElementById("displayMode");
    const loopDuration = document.getElementById("loopDuration");

    displayMode.addEventListener("change", () => this.updateSettingsPreview());
    loopDuration.addEventListener("input", () => this.updateSettingsPreview());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );

    console.log("Event listeners setup complete");
  }

  // Load initial data
  async loadInitialData() {
    try {
      // Load current banners
      await this.loadCurrentBanners();

      // Load settings
      await this.loadSettings();
    } catch (error) {
      console.error("Error loading initial data:", error);
      this.showToast("Error loading data: " + error.message, "error");
    }
  }

  // Handle file selection
  handleFileSelect(event) {
    const files = Array.from(event.target.files);
    this.processSelectedFiles(files);
  }

  // Handle drag over
  handleDragOver(event) {
    event.preventDefault();
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.classList.add("dragover");
  }

  // Handle drag leave
  handleDragLeave(event) {
    event.preventDefault();
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.classList.remove("dragover");
  }

  // Handle file drop
  handleDrop(event) {
    event.preventDefault();
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.classList.remove("dragover");

    const files = Array.from(event.dataTransfer.files);
    this.processSelectedFiles(files);
  }

  // Process selected files
  processSelectedFiles(files) {
    const config = window.BannerConfig.upload;
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      // Check file type
      if (!config.allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Loại file không được hỗ trợ`);
        return;
      }

      // Check file size
      if (file.size > config.maxFileSize) {
        errors.push(
          `${file.name}: File quá lớn (max ${
            config.maxFileSize / 1024 / 1024
          }MB)`
        );
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      this.showToast(errors.join("\n"), "error");
    }

    // Update selected files
    this.selectedFiles = validFiles;

    // Update UI
    this.updateFilePreview();
    this.updateUploadButton();
  }

  // Update file preview
  updateFilePreview() {
    const previewSection = document.getElementById("previewSection");
    const previewContainer = document.getElementById("previewContainer");

    if (this.selectedFiles.length === 0) {
      previewSection.classList.add("hidden");
      return;
    }

    previewSection.classList.remove("hidden");
    previewContainer.innerHTML = "";

    this.selectedFiles.forEach((file, index) => {
      const previewItem = document.createElement("div");
      previewItem.className = "preview-item";

      const img = document.createElement("img");
      img.className = "preview-image";
      img.src = URL.createObjectURL(file);
      img.alt = file.name;

      const info = document.createElement("div");
      info.className = "preview-info";
      info.innerHTML = `
                <div class="preview-name">${file.name}</div>
                <div class="preview-size">${this.formatFileSize(
                  file.size
                )}</div>
                <button class="btn btn-small btn-danger" onclick="app.removeFile(${index})">Xóa</button>
            `;

      previewItem.appendChild(img);
      previewItem.appendChild(info);
      previewContainer.appendChild(previewItem);
    });
  }

  // Update upload button state
  updateUploadButton() {
    const uploadBtn = document.getElementById("uploadBtn");
    const btnText = uploadBtn.querySelector(".btn-text");

    if (this.selectedFiles.length > 0 && !this.isUploading) {
      uploadBtn.disabled = false;
      btnText.textContent = `Upload ${this.selectedFiles.length} banner(s)`;
    } else {
      uploadBtn.disabled = true;
      btnText.textContent = "Upload Banner";
    }
  }

  // Remove file from selection
  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.updateFilePreview();
    this.updateUploadButton();
  }

  // Upload banners
  async uploadBanners() {
    if (this.selectedFiles.length === 0 || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.updateUploadButton();

    const uploadProgress = document.getElementById("uploadProgress");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const uploadBtn = document.getElementById("uploadBtn");
    const btnText = uploadBtn.querySelector(".btn-text");
    const btnLoading = uploadBtn.querySelector(".btn-loading");

    try {
      uploadProgress.classList.remove("hidden");
      btnText.style.display = "none";
      btnLoading.style.display = "inline";

      const totalFiles = this.selectedFiles.length;
      let completedFiles = 0;

      for (const file of this.selectedFiles) {
        console.log(`Uploading file: ${file.name}`);

        // Upload file with progress tracking
        const result = await this.firebaseService.uploadFile(
          file,
          (progress) => {
            const overallProgress =
              (completedFiles / totalFiles) * 100 + progress / totalFiles;
            progressFill.style.width = `${overallProgress}%`;
            progressText.textContent = `${Math.round(overallProgress)}%`;
          }
        );

        console.log(`File uploaded successfully:`, result);

        // Send MQTT notification for this banner
        await this.mqttClient.publishBannerUpdate({
          id: result.id,
          url: result.url,
          metadata: result.metadata,
        });

        completedFiles++;
      }

      // Complete upload
      progressFill.style.width = "100%";
      progressText.textContent = "100%";

      this.showToast(
        `Successfully uploaded ${totalFiles} banner(s)`,
        "success"
      );

      // Reset UI
      this.selectedFiles = [];
      this.updateFilePreview();

      // Reload current banners
      await this.loadCurrentBanners();
    } catch (error) {
      console.error("Upload error:", error);
      this.showToast("Upload failed: " + error.message, "error");
    } finally {
      this.isUploading = false;
      uploadProgress.classList.add("hidden");
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
      this.updateUploadButton();
    }
  }

  // Load current banners
  async loadCurrentBanners() {
    try {
      console.log("Loading current banners...");
      const banners = await this.firebaseService.getBanners();
      this.currentBanners = banners;
      this.renderBannersGrid();
      console.log(`Loaded ${banners.length} banners`);
    } catch (error) {
      console.error("Error loading banners:", error);
      this.showToast("Error loading banners: " + error.message, "error");
    }
  }

  // Render banners grid
  renderBannersGrid() {
    const bannersGrid = document.getElementById("bannersGrid");

    if (this.currentBanners.length === 0) {
      bannersGrid.innerHTML =
        '<div class="loading-placeholder">Chưa có banner nào được upload</div>';
      return;
    }

    bannersGrid.innerHTML = "";

    this.currentBanners.forEach((banner) => {
      const bannerItem = document.createElement("div");
      bannerItem.className = "banner-item";

      bannerItem.innerHTML = `
                <img src="${banner.url}" alt="${
        banner.name
      }" class="banner-image" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZGRkIi8+CiAgICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZHk9Ii4zZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkVycm9yPC90ZXh0Pgo8L3N2Zz4K'">
                <div class="banner-info">
                    <div class="banner-name">${banner.name}</div>
                    <div class="banner-size">${this.formatFileSize(
                      banner.size
                    )}</div>
                    <div class="banner-actions">
                        <button class="btn btn-small btn-danger" onclick="app.deleteBanner('${
                          banner.id
                        }')">Xóa</button>
                    </div>
                </div>
            `;

      bannersGrid.appendChild(bannerItem);
    });
  }

  // Delete banner
  async deleteBanner(bannerId) {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) {
      return;
    }

    try {
      console.log(`Deleting banner: ${bannerId}`);
      await this.firebaseService.deleteBanner(bannerId);

      // Send MQTT notification
      await this.mqttClient.publishBannerDelete(bannerId);

      this.showToast("Banner deleted successfully", "success");
      await this.loadCurrentBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      this.showToast("Error deleting banner: " + error.message, "error");
    }
  }

  // Load settings
  async loadSettings() {
    try {
      const settings = await this.firebaseService.getSettings();

      document.getElementById("displayMode").value =
        settings.displayMode || "loop";
      document.getElementById("loopDuration").value =
        settings.loopDuration || 10;

      console.log("Settings loaded:", settings);
    } catch (error) {
      console.error("Error loading settings:", error);
      this.showToast("Error loading settings: " + error.message, "error");
    }
  }

  // Sync settings
  async syncSettings() {
    try {
      const displayMode = document.getElementById("displayMode").value;
      const loopDuration = parseInt(
        document.getElementById("loopDuration").value
      );

      const settings = {
        displayMode: displayMode,
        loopDuration: loopDuration,
      };

      console.log("Syncing settings:", settings);

      await this.firebaseService.updateSettings(settings);

      // Send MQTT notification
      await this.mqttClient.publishSettingsSync(settings);

      this.showToast("Settings synced successfully", "success");
    } catch (error) {
      console.error("Error syncing settings:", error);
      this.showToast("Error syncing settings: " + error.message, "error");
    }
  }

  // Update settings preview
  updateSettingsPreview() {
    const displayMode = document.getElementById("displayMode").value;
    const loopDuration = parseInt(
      document.getElementById("loopDuration").value
    );

    // You can add real-time preview logic here
    console.log("Settings preview updated:", { displayMode, loopDuration });
  }

  // Update connection status in UI
  updateConnectionStatus(status) {
    const statusIndicator = document.getElementById("statusIndicator");
    const statusText = document.getElementById("statusText");

    statusIndicator.className = "status-indicator";

    switch (status.status) {
      case "connected":
        statusIndicator.classList.add("online");
        statusText.textContent = "Đã kết nối";
        break;
      case "connecting":
      case "reconnecting":
        statusIndicator.classList.add("connecting");
        statusText.textContent = "Đang kết nối...";
        break;
      case "disconnected":
        statusIndicator.classList.add("offline");
        statusText.textContent = "Mất kết nối";
        break;
      case "error":
        statusIndicator.classList.add("offline");
        statusText.textContent = "Lỗi kết nối";
        break;
      default:
        statusIndicator.classList.add("offline");
        statusText.textContent = "Không xác định";
    }
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcuts(event) {
    // Ctrl+U: Upload
    if (event.ctrlKey && event.key === "u") {
      event.preventDefault();
      this.triggerFileSelect();
    }

    // Ctrl+S: Sync settings
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      this.syncSettings();
    }

    // Esc: Close modal
    if (event.key === "Escape") {
      this.closeModal();
    }
  }

  // Utility: Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Show toast notification
  showToast(message, type = "info", duration = 5000) {
    const toastContainer = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const emoji = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    toast.innerHTML = `
            <span class="toast-emoji">${emoji[type] || emoji.info}</span>
            <span class="toast-message">${message}</span>
        `;

    toastContainer.appendChild(toast);

    // Auto remove toast
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);

    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // Show modal
  showModal(title, content) {
    const modal = document.getElementById("modal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.remove("hidden");
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.add("hidden");
  }
}

// Global functions for HTML onclick handlers
function triggerFileSelect() {
  document.getElementById("fileInput").click();
}

function uploadBanners() {
  if (window.app) {
    window.app.uploadBanners();
  }
}

function syncSettings() {
  if (window.app) {
    window.app.syncSettings();
  }
}

function showHelp() {
  if (window.app) {
    window.app.showModal(
      "Hướng dẫn sử dụng",
      `
            <h4>Cách sử dụng Banner Management System:</h4>
            <ul>
                <li><strong>Upload Banner:</strong> Kéo thả file ảnh hoặc click "Chọn Files"</li>
                <li><strong>Quản lý Banner:</strong> Xem danh sách và xóa banner trong phần "Banner Hiện Tại"</li>
                <li><strong>Cài đặt:</strong> Thay đổi chế độ hiển thị và thời gian xoay banner</li>
                <li><strong>Phím tắt:</strong> Ctrl+U (Upload), Ctrl+S (Sync), Esc (Đóng modal)</li>
            </ul>
            <p><strong>Lưu ý:</strong> File ảnh hỗ trợ PNG, JPG, GIF với kích thước tối đa 5MB</p>
        `
    );
  }
}

function showAbout() {
  if (window.app) {
    window.app.showModal(
      "Về chúng tôi",
      `
            <h4>ITS Billboard Management System</h4>
            <p><strong>Version:</strong> ${window.BannerConfig.app.version}</p>
            <p><strong>Công ty:</strong> ITS Company</p>
            <p><strong>Mô tả:</strong> Hệ thống quản lý banner quảng cáo từ xa cho billboard outdoor</p>
            <br>
            <p><strong>Công nghệ sử dụng:</strong></p>
            <ul>
                <li>Firebase Storage & Firestore</li>
                <li>MQTT Real-time Communication</li>
                <li>Glass Effect UI Design</li>
                <li>Progressive Web App</li>
            </ul>
        `
    );
  }
}

function closeModal() {
  if (window.app) {
    window.app.closeModal();
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing app...");
  window.app = new BannerManagementApp();
});
