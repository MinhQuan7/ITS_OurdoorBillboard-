// CompanyLogo.tsx - Component for displaying company logo with config support
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./CompanyLogo.css";

interface LogoConfig {
  logoMode: "fixed" | "loop" | "scheduled";
  logoImages: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>;
  logoLoopDuration: number;
  schedules: Array<{
    time: string;
    logoIndex: number;
    days: string;
  }>;
}

/**
 * CompanyLogo Component
 * Displays logo based on configuration with support for:
 * - Fixed single logo
 * - Loop multiple logos
 * - Scheduled display
 * Size: 384px width x 96px height (1/4 of total height)
 */
const CompanyLogo: React.FC = () => {
  const [config, setConfig] = useState<LogoConfig | null>(null);
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to clear existing interval
  const clearLogoInterval = useCallback(() => {
    if (intervalRef.current) {
      console.log(
        `CLEARING logo interval: ${
          intervalRef.current
        } at ${new Date().toLocaleTimeString()}`
      );
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Function to start logo rotation with immediate effect
  const startLogoRotation = useCallback(
    (newConfig: LogoConfig) => {
      // Clear any existing interval first
      clearLogoInterval();

      if (
        newConfig.logoMode !== "loop" ||
        !newConfig.logoImages ||
        newConfig.logoImages.length <= 1
      ) {
        console.log("Logo rotation disabled:", {
          mode: newConfig.logoMode,
          imageCount: newConfig.logoImages?.length,
        });
        return;
      }

      const duration = newConfig.logoLoopDuration * 1000;
      console.log(
        `Starting NEW logo rotation: ${newConfig.logoLoopDuration} seconds (${duration}ms) - Reset index to 0`
      );

      // Reset current index when starting new rotation
      setCurrentLogoIndex(0);

      // Use a small delay to ensure state is updated before starting interval
      setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setCurrentLogoIndex((prev) => {
            const nextIndex = (prev + 1) % newConfig.logoImages.length;
            console.log(
              `Logo rotation: ${prev} -> ${nextIndex} (duration: ${
                newConfig.logoLoopDuration
              }s) at ${new Date().toLocaleTimeString()}`
            );
            return nextIndex;
          });
        }, duration);

        console.log(
          `NEW Logo rotation interval created with ID: ${intervalRef.current} - Duration: ${duration}ms`
        );
      }, 100);
    },
    [clearLogoInterval]
  );

  // Load configuration function
  const loadConfig = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const savedConfig = await window.electronAPI.getConfig();
        console.log("Loaded logo config:", savedConfig);
        setConfig(savedConfig);
        // Start rotation immediately after loading config
        if (savedConfig) {
          startLogoRotation(savedConfig);
        }
      }
    } catch (error) {
      console.error("Error loading logo config:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startLogoRotation]);

  // Load configuration on mount
  useEffect(() => {
    console.log(
      "CompanyLogo useEffect: Setting up configuration and event listeners"
    );
    loadConfig();

    // Listen for general config updates
    if (window.electronAPI) {
      const configUpdateHandler = (_event: any, updatedConfig: LogoConfig) => {
        console.log("CONFIG UPDATED EVENT RECEIVED:", {
          mode: updatedConfig.logoMode,
          duration: updatedConfig.logoLoopDuration,
          imageCount: updatedConfig.logoImages?.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Force clear any existing interval before updating config
        clearLogoInterval();

        setConfig(updatedConfig);
        // Immediately restart logo rotation with new config
        startLogoRotation(updatedConfig);
      };

      window.electronAPI.onConfigUpdated(configUpdateHandler);

      // Listen for logo-specific config updates for immediate interval changes
      if (window.electronAPI.onLogoConfigUpdated) {
        const logoConfigHandler = (
          _event: any,
          logoConfig: Partial<LogoConfig>
        ) => {
          console.log("LOGO CONFIG UPDATED EVENT RECEIVED:", {
            mode: logoConfig.logoMode,
            duration: logoConfig.logoLoopDuration,
            imageCount: logoConfig.logoImages?.length,
            timestamp: new Date().toLocaleTimeString(),
          });

          // Force clear existing interval before updating
          clearLogoInterval();

          // Update config state and immediately apply new rotation
          setConfig((prevConfig) => {
            const newConfig = {
              logoMode: logoConfig.logoMode ?? prevConfig?.logoMode ?? "fixed",
              logoImages: logoConfig.logoImages ?? prevConfig?.logoImages ?? [],
              logoLoopDuration:
                logoConfig.logoLoopDuration ??
                prevConfig?.logoLoopDuration ??
                5,
              schedules: logoConfig.schedules ?? prevConfig?.schedules ?? [],
            };

            console.log("Applying new logo config:", newConfig);

            // Start rotation immediately with new config
            setTimeout(() => {
              startLogoRotation(newConfig);
            }, 50);

            return newConfig;
          });
        };

        window.electronAPI.onLogoConfigUpdated(logoConfigHandler);
      }

      // Also listen for force refresh events
      if (window.electronAPI.onForceRefreshServices) {
        const forceRefreshHandler = (_event: any, config: LogoConfig) => {
          console.log("FORCE REFRESH EVENT RECEIVED:", {
            mode: config.logoMode,
            duration: config.logoLoopDuration,
            timestamp: new Date().toLocaleTimeString(),
          });

          clearLogoInterval();
          setConfig(config);
          startLogoRotation(config);
        };

        window.electronAPI.onForceRefreshServices(forceRefreshHandler);
      }
    }
    return () => {
      console.log(
        "CompanyLogo cleanup: Removing event listeners and clearing intervals"
      );
      clearLogoInterval();
      if (window.electronAPI) {
        window.electronAPI.removeConfigListener();
        if (window.electronAPI.removeLogoConfigListener) {
          window.electronAPI.removeLogoConfigListener();
        }
        if (window.electronAPI.removeForceRefreshListener) {
          window.electronAPI.removeForceRefreshListener();
        }
      }
    };
  }, [loadConfig, startLogoRotation, clearLogoInterval]);

  // Get current logo to display based on mode
  const getCurrentLogo = () => {
    if (!config || config.logoImages.length === 0) {
      return null;
    }

    switch (config.logoMode) {
      case "fixed":
        return config.logoImages[0];

      case "loop":
        return config.logoImages[currentLogoIndex];

      case "scheduled":
        // Find current scheduled logo based on time
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        const activeSchedule = config.schedules.find((schedule) => {
          return (
            schedule.time <= currentTime &&
            schedule.logoIndex < config.logoImages.length
          );
        });

        return activeSchedule
          ? config.logoImages[activeSchedule.logoIndex]
          : config.logoImages[0];

      default:
        return config.logoImages[0];
    }
  };

  // Render default fallback when no config or loading
  const renderDefaultLogo = () => (
    <div className="logo-container">
      <div className="logo-circle">C</div>
      <div className="logo-text-container">
        <div className="logo-main-text">CÔNG TY</div>
        <div className="logo-sub-text">VÌ CUỘC SỐNG TỐT ĐẸP HƠN</div>
      </div>
    </div>
  );

  // Render configured logo
  const renderConfiguredLogo = (logo: any) => (
    <div className="logo-container">
      <div className="logo-image-container">
        <img
          src={logo.path}
          alt={logo.name}
          className="logo-image"
          onError={(e) => {
            console.error("Logo image failed to load:", logo.path);
            // Fallback to default logo on error
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      {config?.logoMode === "loop" && config.logoImages.length > 1 && (
        <div className="logo-indicator">
          {currentLogoIndex + 1} / {config.logoImages.length}
        </div>
      )}
    </div>
  );

  // All styles are now in CompanyLogo.css

  // Show loading state
  if (isLoading) {
    return (
      <div className="logo-container loading">
        <div className="logo-loading">Loading...</div>
      </div>
    );
  }

  // Get current logo to display
  const currentLogo = getCurrentLogo();

  // Render appropriate logo
  return currentLogo ? renderConfiguredLogo(currentLogo) : renderDefaultLogo();
};

export default CompanyLogo;
