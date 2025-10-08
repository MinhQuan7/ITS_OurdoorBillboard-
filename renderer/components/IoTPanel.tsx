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

    console.log("IoTPanel: Initializing with E-Ra IoT service");

    // Set up polling for sensor data updates
    const pollInterval = setInterval(() => {
      const data = eraIotService.getCurrentData();

      if (data) {
        console.log("IoTPanel: Received sensor data:", {
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
      } else {
        console.log("IoTPanel: No sensor data available from service");
        if (!isLoading) {
          setConnectionStatus("offline");
        }
      }
    }, 3000); // Poll every 3 seconds for more responsive updates

    // Initial data fetch
    const initialData = eraIotService.getCurrentData();
    if (initialData) {
      setSensorData(initialData);
      setIsLoading(false);
      setConnectionStatus(
        initialData.status === "error" ? "error" : "connected"
      );
    }

    return () => {
      clearInterval(pollInterval);
    };
  }, [eraIotService, isLoading]);

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
        unit: "°",
        status: getSensorStatus(data.temperature, "temperature"),
        icon: "",
      },
      {
        label: "Độ ẩm",
        value: data.humidity !== null ? `${data.humidity.toFixed(0)}` : "--",
        unit: "%",
        status: getSensorStatus(data.humidity, "humidity"),
        icon: "",
      },
      {
        label: "PM2.5",
        value: data.pm25 !== null ? `${data.pm25.toFixed(1)}` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm25, "pm25"),
        icon: "",
      },
      {
        label: "PM10",
        value: data.pm10 !== null ? `${data.pm10.toFixed(1)}` : "--",
        unit: "μg/m³",
        status: getSensorStatus(data.pm10, "pm10"),
        icon: "",
      },
    ];
  };

  // Render loading state
  if (isLoading && !sensorData) {
    return (
      <div className={`iot-panel-redesigned loading ${className}`}>
        <div className="iot-panel-header">
          <div className="iot-panel-title">THIẾT BỊ ĐO</div>
        </div>
        <div className="iot-loading-state">
          <div className="loading-text">Đang kết nối...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (!eraIotService || (!sensorData && connectionStatus === "error")) {
    return (
      <div className={`iot-panel-redesigned error ${className}`}>
        <div className="iot-panel-header">
          <div className="iot-panel-title">THIẾT BỊ ĐO</div>
        </div>
        <div className="iot-error-state">
          <div className="error-text">
            {!eraIotService ? "Chưa cấu hình" : "Lỗi kết nối"}
          </div>
        </div>
      </div>
    );
  }

  // Render offline state
  if (!sensorData) {
    return (
      <div className={`iot-panel-redesigned offline ${className}`}>
        <div className="iot-panel-header">
          <div className="iot-panel-title">THIẾT BỊ ĐO</div>
        </div>
        <div className="iot-offline-state">
          <div className="offline-text">Không có dữ liệu</div>
        </div>
      </div>
    );
  }

  const sensors = formatSensorData(sensorData);

  return (
    <div
      className={`iot-panel-redesigned active ${connectionStatus} ${className}`}
      onClick={handleRefresh}
    >
      {/* Header section */}
      <div className="iot-panel-header">
        <div className="iot-panel-title">THIẾT BỊ ĐO</div>
      </div>

      {/* Sensor Values Display */}
      <div className="iot-sensor-values">
        {sensors.map((sensor, index) => (
          <div key={index} className="iot-sensor-row">
            <div className="iot-sensor-label">{sensor.label}</div>
            <div className="iot-sensor-value">
              {sensor.value}
              <span className="iot-sensor-unit">{sensor.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Air Quality Status */}
      <div className="iot-air-quality">
        <div className="air-quality-text">Chất lượng không khí: Tốt</div>
        <div className="air-quality-badge">TỐT</div>
      </div>

      {/* Loading overlay for refresh */}
      {isLoading && (
        <div className="iot-refresh-overlay">
          <div className="refresh-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default IoTPanel;
