// IoTPanel.tsx - Real-time sensor data display using E-Ra IoT Platform
import React, { useState, useEffect } from "react";
import EraIotService, { EraIotData } from "../services/eraIotService";
import "./IoTPanel.css";

interface IoTPanelProps {
  className?: string;
  eraIotService?: EraIotService;
}

interface SensorDisplayItem {
  label: string;
  value: string | number;
  unit: string;
  status: "good" | "warning" | "error" | "offline";
  icon: string;
}

const IoTPanel: React.FC<IoTPanelProps> = ({
  className = "",
  eraIotService,
}) => {
  const [sensorData, setSensorData] = useState<EraIotData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "error" | "offline"
  >("offline");

  useEffect(() => {
    if (!eraIotService) {
      console.log("IoTPanel: No E-Ra IoT service provided");
      setIsLoading(false);
      setConnectionStatus("offline");
      return;
    }

    console.log("IoTPanel: Initializing with real-time E-Ra IoT service");

    // Subscribe to real-time data updates (receives updates every second from MQTT service)
    const unsubscribeData = eraIotService.onDataUpdate((data) => {
      console.log("IoTPanel: Real-time data update received:", {
        temperature: data.temperature,
        humidity: data.humidity,
        pm25: data.pm25,
        pm10: data.pm10,
        status: data.status,
        lastUpdated: data.lastUpdated,
        errorMessage: data.errorMessage,
      });

      setSensorData(data);
      setIsLoading(false);

      // Update connection status based on data status
      switch (data.status) {
        case "success":
          setConnectionStatus("connected");
          break;
        case "partial":
          setConnectionStatus("connected"); // Still showing some data
          break;
        case "error":
          setConnectionStatus("error");
          break;
        default:
          setConnectionStatus("offline");
      }
    });

    // Subscribe to service status updates
    const unsubscribeStatus = eraIotService.onStatusUpdate((status) => {
      console.log("IoTPanel: Service status update:", status);

      if (!status.isRunning && !sensorData) {
        setConnectionStatus("offline");
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeData();
      unsubscribeStatus();
    };
  }, [eraIotService, sensorData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!eraIotService) return;

    console.log("IoTPanel: Manual refresh requested");
    setIsLoading(true);

    try {
      await eraIotService.refreshData();

      // Give some time for the service to update
      setTimeout(() => {
        const updatedData = eraIotService.getCurrentData();
        if (updatedData) {
          setSensorData(updatedData);
          setConnectionStatus(
            updatedData.status === "error" ? "error" : "connected"
          );
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("IoTPanel: Manual refresh failed:", error);
      setConnectionStatus("error");
      setIsLoading(false);
    }
  };

  // Format sensor data for display
  const formatSensorData = (data: EraIotData): SensorDisplayItem[] => {
    const getSensorStatus = (
      value: number | null,
      type: string
    ): "good" | "warning" | "error" | "offline" => {
      if (value === null) return "offline";

      switch (type) {
        case "temperature":
          if (value >= 15 && value <= 35) return "good";
          if (value >= 10 && value <= 40) return "warning";
          return "error";
        case "humidity":
          if (value >= 30 && value <= 70) return "good";
          if (value >= 20 && value <= 80) return "warning";
          return "error";
        case "pm25":
          if (value <= 12) return "good";
          if (value <= 35) return "warning";
          return "error";
        case "pm10":
          if (value <= 20) return "good";
          if (value <= 50) return "warning";
          return "error";
        default:
          return "good";
      }
    };

    return [
      {
        label: "Nhiệt độ",
        value:
          data.temperature !== null ? `${data.temperature.toFixed(1)}` : "--",
        unit: "°C",
        status: getSensorStatus(data.temperature, "temperature"),
        icon: "T",
      },
      {
        label: "Độ ẩm",
        value: data.humidity !== null ? `${data.humidity.toFixed(1)}` : "--",
        unit: "%",
        status: getSensorStatus(data.humidity, "humidity"),
        icon: "H",
      },
      {
        label: "PM2.5",
        value: data.pm25 !== null ? `${data.pm25.toFixed(1)}` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm25, "pm25"),
        icon: "P2",
      },
      {
        label: "PM10",
        value: data.pm10 !== null ? `${data.pm10.toFixed(1)}` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm10, "pm10"),
        icon: "P10",
      },
    ];
  };

  // Render loading state
  if (isLoading && !sensorData) {
    return (
      <div className={`iot-panel loading ${className}`}>
        <div className="iot-header">
          <div className="iot-title">CẢM BIẾN THÔNG MINH</div>
          <div className="iot-subtitle">E-Ra IoT Platform</div>
        </div>
        <div className="iot-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">Đang kết nối...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (!eraIotService || (!sensorData && connectionStatus === "error")) {
    return (
      <div className={`iot-panel error ${className}`}>
        <div className="iot-header">
          <div className="iot-title">CẢM BIẾN THÔNG MINH</div>
          <div className="iot-subtitle">E-Ra IoT Platform</div>
        </div>
        <div className="iot-error">
          <div className="error-icon">!</div>
          <div className="error-text">
            {!eraIotService ? "Chưa cấu hình" : "Lỗi kết nối"}
          </div>
          {eraIotService && (
            <button className="retry-button" onClick={handleRefresh}>
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render offline state
  if (!sensorData) {
    return (
      <div className={`iot-panel offline ${className}`}>
        <div className="iot-header">
          <div className="iot-title">CẢM BIẾN THÔNG MINH</div>
          <div className="iot-subtitle">E-Ra IoT Platform</div>
        </div>
        <div className="iot-offline">
          <div className="offline-icon">X</div>
          <div className="offline-text">Không có dữ liệu</div>
          <button className="retry-button" onClick={handleRefresh}>
            Kết nối lại
          </button>
        </div>
      </div>
    );
  }

  const sensors = formatSensorData(sensorData);

  return (
    <div
      className={`iot-panel active ${connectionStatus} ${className}`}
      onClick={handleRefresh}
    >
      {/* Header */}
      <div className="iot-header">
        <div className="iot-title">CẢM BIẾN THÔNG MINH</div>
        <div className="iot-subtitle">E-Ra IoT Platform</div>
        <div className={`connection-indicator ${connectionStatus}`}></div>
      </div>

      {/* Status banner for partial/error states */}
      {sensorData.status !== "success" && (
        <div className={`status-banner ${sensorData.status}`}>
          {sensorData.status === "partial"
            ? "! Một số cảm biến offline"
            : "X Lỗi kết nối cảm biến"}
        </div>
      )}

      {/* Sensor grid */}
      <div className="sensors-grid">
        {sensors.map((sensor, index) => (
          <div key={index} className={`sensor-item ${sensor.status}`}>
            <div className="sensor-icon">{sensor.icon}</div>
            <div className="sensor-content">
              <div className="sensor-label">{sensor.label}</div>
              <div className="sensor-value-container">
                <span className="sensor-value">{sensor.value}</span>
                <span className="sensor-unit">{sensor.unit}</span>
              </div>
            </div>
            <div className={`sensor-status-indicator ${sensor.status}`}></div>
          </div>
        ))}
      </div>

      {/* Last updated info */}
      <div className="iot-footer">
        <div className="last-updated">
          Cập nhật: {sensorData.lastUpdated.toLocaleTimeString("vi-VN")}
        </div>
        {sensorData.errorMessage && (
          <div className="error-message-small" title={sensorData.errorMessage}>
            ! {sensorData.errorMessage.substring(0, 50)}...
          </div>
        )}
      </div>

      {/* Loading overlay for refresh */}
      {isLoading && (
        <div className="refresh-overlay">
          <div className="refresh-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default IoTPanel;
