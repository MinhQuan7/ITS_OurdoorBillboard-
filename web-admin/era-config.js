// E-Ra IoT Platform Configuration
const ERA_CONFIG = {
  // Thay đổi các thông số này theo config E-Ra của bạn
  AUTH_TOKEN: "your-era-auth-token-here",
  DEVICE_ID: "your-device-id-here",
  API_BASE_URL: "https://api.eoh.io/api/v1",
  MQTT_BROKER: "mqtt.eoh.io",
  MQTT_PORT: 1883,

  // Banner data variables trên E-Ra platform
  VARIABLES: {
    BANNER_DATA: "banner_data",
    BANNER_FILENAME: "banner_filename",
    BANNER_TIMESTAMP: "banner_timestamp",
    BANNER_STATUS: "banner_status",
    DEVICE_STATUS: "device_status",
  },
};

// E-Ra API Helper Class
class EraAPI {
  constructor(config) {
    this.config = config;
    this.baseURL = config.API_BASE_URL;
    this.authToken = config.AUTH_TOKEN;
    this.deviceId = config.DEVICE_ID;
  }

  // Generic API call method
  async apiCall(endpoint, method = "GET", data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method: method,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("E-Ra API Error:", error);
      throw error;
    }
  }

  // Update variable value on E-Ra platform
  async updateVariable(variableName, value) {
    const endpoint = `/devices/${this.deviceId}/variables/${variableName}`;
    return await this.apiCall(endpoint, "POST", { value: value });
  }

  // Get variable value from E-Ra platform
  async getVariable(variableName) {
    const endpoint = `/devices/${this.deviceId}/variables/${variableName}`;
    return await this.apiCall(endpoint, "GET");
  }

  // Get device status
  async getDeviceStatus() {
    const endpoint = `/devices/${this.deviceId}`;
    return await this.apiCall(endpoint, "GET");
  }

  // Upload banner data (Base64 encoded)
  async uploadBanner(base64Data, filename, timestamp) {
    try {
      // Update banner data
      await this.updateVariable(this.config.VARIABLES.BANNER_DATA, base64Data);

      // Update filename
      await this.updateVariable(
        this.config.VARIABLES.BANNER_FILENAME,
        filename
      );

      // Update timestamp
      await this.updateVariable(
        this.config.VARIABLES.BANNER_TIMESTAMP,
        timestamp
      );

      // Update status
      await this.updateVariable(
        this.config.VARIABLES.BANNER_STATUS,
        "uploaded"
      );

      console.log("Banner uploaded successfully to E-Ra platform");
      return true;
    } catch (error) {
      console.error("Failed to upload banner:", error);
      return false;
    }
  }

  // Get current banner info
  async getCurrentBanner() {
    try {
      const bannerData = await this.getVariable(
        this.config.VARIABLES.BANNER_DATA
      );
      const filename = await this.getVariable(
        this.config.VARIABLES.BANNER_FILENAME
      );
      const timestamp = await this.getVariable(
        this.config.VARIABLES.BANNER_TIMESTAMP
      );

      return {
        data: bannerData.value,
        filename: filename.value,
        timestamp: timestamp.value,
      };
    } catch (error) {
      console.error("Failed to get current banner:", error);
      return null;
    }
  }
}

// File size limits và validation
const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  CHUNK_SIZE: 64 * 1024, // 64KB chunks nếu cần
};

// Utility functions
const Utils = {
  // Convert file to Base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1]; // Remove data:image/xxx;base64,
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Convert Base64 to blob URL
  base64ToBlobURL: (base64Data, mimeType = "image/jpeg") => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return URL.createObjectURL(blob);
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Format timestamp
  formatTimestamp: (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("vi-VN");
  },

  // Validate file
  validateFile: (file) => {
    const errors = [];

    if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      errors.push(
        "File type not supported. Please use JPEG, PNG, GIF, or WebP."
      );
    }

    if (file.size > FILE_CONFIG.MAX_SIZE) {
      errors.push(
        `File size too large. Maximum size is ${Utils.formatFileSize(
          FILE_CONFIG.MAX_SIZE
        )}.`
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },
};

// Initialize E-Ra API instance
const eraAPI = new EraAPI(ERA_CONFIG);
