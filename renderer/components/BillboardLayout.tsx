// BillboardLayout.tsx - Main layout for 384x384 LED screen
import React, { useState, useEffect } from "react";
import WeatherPanel from "./WeatherPanel";
import IoTPanel from "./IoTPanel";
import CompanyLogo from "./CompanyLogo";
import EraIotService, { EraIotConfig } from "../services/eraIotService";
import "./BillboardLayout.css";

/**
 * BillboardLayout Component
 * Divides layout into 3 areas:
 * - Top row: 2 columns (Weather + IoT) - takes 75% height
 * - Bottom row: Company Logo - takes 25% height
 */
interface BillboardLayoutProps {
  configUpdateTrigger?: number;
}

const BillboardLayout: React.FC<BillboardLayoutProps> = ({
  configUpdateTrigger = 0,
}) => {
  const [eraIotService, setEraIotService] = useState<EraIotService | null>(
    null
  );
  const [showWeatherAlert, setShowWeatherAlert] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [logoUpdateTrigger, setLogoUpdateTrigger] = useState<number>(0);

  console.log("BillboardLayout: Component initialized");

  // Handle weather data updates from WeatherPanel
  const handleWeatherUpdate = (data: any) => {
    setWeatherData(data);

    // Determine if we should show weather alert
    if (data) {
      const shouldShowAlert =
        data.rainProbability > 70 ||
        data.weatherCondition?.includes("mưa to") ||
        data.weatherCondition?.includes("dông");
      setShowWeatherAlert(shouldShowAlert);
    } else {
      setShowWeatherAlert(false);
    }
  };

  useEffect(() => {
    console.log(
      "BillboardLayout: useEffect triggered, configUpdateTrigger:",
      configUpdateTrigger
    );
    // Load E-Ra IoT configuration and initialize service
    const initializeEraIot = async () => {
      try {
        const config = await loadEraIotConfig();
        console.log("BillboardLayout: Loaded E-Ra IoT config:", {
          hasConfig: !!config,
          enabled: config?.enabled,
          hasAuthToken: !!config?.authToken,
          authTokenPreview: config?.authToken?.substring(0, 20) + "...",
          isPlaceholder: config?.authToken?.includes("1234272955"),
        });

        if (config && config.authToken && config.authToken.trim() !== "") {
          if (config.authToken.includes("1234272955")) {
            console.log(
              "BillboardLayout: E-Ra IoT using placeholder AUTHTOKEN - will show error state"
            );
          } else {
            console.log(
              "BillboardLayout: Initializing E-Ra IoT service with valid config"
            );
          }

          // Cleanup existing service
          if (eraIotService) {
            eraIotService.destroy();
          }

          const service = new EraIotService(config);
          service.startPeriodicUpdates();
          setEraIotService(service);
        } else {
          console.log(
            "BillboardLayout: No valid E-Ra IoT configuration found - missing or invalid AUTHTOKEN"
          );
          if (eraIotService) {
            eraIotService.destroy();
            setEraIotService(null);
          }
        }
      } catch (error) {
        console.error(
          "BillboardLayout: Failed to initialize E-Ra IoT service:",
          error
        );
      }
    };

    // Initial setup
    initializeEraIot();

    // Listen for configuration updates
    const handleConfigUpdate = (_event: any, updatedConfig: any) => {
      console.log(
        "BillboardLayout: Configuration updated, reinitializing services",
        {
          hasLogoConfig: !!updatedConfig?.logoMode,
          logoMode: updatedConfig?.logoMode,
          logoLoopDuration: updatedConfig?.logoLoopDuration,
          hasEraIot: !!updatedConfig?.eraIot,
        }
      );

      // Trigger logo update
      if (updatedConfig?.logoMode || updatedConfig?.logoLoopDuration) {
        console.log("BillboardLayout: Triggering logo update");
        setLogoUpdateTrigger((prev) => prev + 1);
      }

      // Reinitialize E-Ra IoT service
      setTimeout(async () => {
        await initializeEraIot();
      }, 1000); // Small delay to ensure config is saved
    };

    // Setup event listeners for config updates
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onEraIotConfigUpdated
    ) {
      (window as any).electronAPI.onEraIotConfigUpdated(handleConfigUpdate);
    }

    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onConfigUpdated
    ) {
      (window as any).electronAPI.onConfigUpdated(handleConfigUpdate);
    }

    // Also listen for general config updates
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onConfigUpdated
    ) {
      (window as any).electronAPI.onConfigUpdated(handleConfigUpdate);
    }

    // Listen for force refresh events
    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onForceRefreshServices
    ) {
      (window as any).electronAPI.onForceRefreshServices(handleConfigUpdate);
    }

    if (
      typeof window !== "undefined" &&
      (window as any).electronAPI?.onConfigUpdated
    ) {
      (window as any).electronAPI.onConfigUpdated(handleConfigUpdate);
    }

    return () => {
      if (eraIotService) {
        eraIotService.destroy();
      }
    };
  }, [configUpdateTrigger]);

  // Load E-Ra IoT configuration
  const loadEraIotConfig = async (): Promise<EraIotConfig | null> => {
    try {
      console.log("BillboardLayout: Loading E-Ra IoT configuration...");

      // Try to access config from electron main process
      if (typeof window !== "undefined" && (window as any).electronAPI) {
        console.log(
          "BillboardLayout: electronAPI available, fetching config..."
        );

        const config = await (window as any).electronAPI.getConfig?.();
        console.log("BillboardLayout: Raw config received:", {
          hasEraIot: !!config?.eraIot,
          enabled: config?.eraIot?.enabled,
          hasAuthToken: !!config?.eraIot?.authToken,
          authTokenPrefix: config?.eraIot?.authToken?.substring(0, 10),
        });

        if (config?.eraIot && config.eraIot.authToken) {
          return {
            enabled: config.eraIot.enabled,
            authToken: config.eraIot.authToken,
            baseUrl: config.eraIot.baseUrl || "https://backend.eoh.io",
            sensorConfigs: config.eraIot.sensorConfigs || {
              temperature: null,
              humidity: null,
              pm25: null,
              pm10: null,
            },
            updateInterval: config.eraIot.updateInterval || 5,
            timeout: config.eraIot.timeout || 15000,
            retryAttempts: config.eraIot.retryAttempts || 3,
            retryDelay: config.eraIot.retryDelay || 2000,
          };
        }
      } else {
        console.log("BillboardLayout: electronAPI not available");
      }

      // Fallback: Try localStorage
      console.log("BillboardLayout: Trying localStorage fallback...");
      const storedConfig = localStorage.getItem("eraIotConfig");
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        console.log("BillboardLayout: Found localStorage config:", {
          hasAuthToken: !!parsedConfig.authToken,
        });
        if (parsedConfig.authToken) {
          return parsedConfig;
        }
      }

      console.log("BillboardLayout: No E-Ra IoT config found");
      return null;
    } catch (error) {
      console.error("BillboardLayout: Failed to load E-Ra IoT config:", error);
      return null;
    }
  };

  return (
    <div className="billboard-container">
      {/* Top row: Two columns - Weather and IoT */}
      <div className="top-row">
        {/* Weather Panel */}
        <div className="weather-column">
          <WeatherPanel
            className="weather-panel-column"
            onWeatherUpdate={handleWeatherUpdate}
          />
        </div>

        {/* IoT Panel */}
        <div className="iot-column">
          <IoTPanel
            className="iot-panel-column"
            eraIotService={eraIotService || undefined}
          />
        </div>
      </div>

      {/* Weather Alert Banner - positioned between top row and bottom row */}
      {showWeatherAlert && (
        <div className="weather-alert-banner">
          <div className="alert-icon-warning">!</div>
          <div className="alert-text-large">CẢNH BÁO MƯA LỚN</div>
        </div>
      )}

      {/* Bottom row: Company Logo */}
      {/* Bottom row: Company Logo */}
      <div className="bottom-row">
        <CompanyLogo key={logoUpdateTrigger} />
      </div>
    </div>
  );
};

export default BillboardLayout;
