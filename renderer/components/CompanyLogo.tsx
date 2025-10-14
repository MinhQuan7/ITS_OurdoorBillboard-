// CompanyLogo.tsx - Component for displaying company logo with config support
import React, { useState, useEffect } from "react";
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

  // Load configuration on mount
  useEffect(() => {
    loadConfig();

    // Listen for config updates
    if (window.electronAPI) {
      window.electronAPI.onConfigUpdated(
        (_event: any, updatedConfig: LogoConfig) => {
          console.log("Logo config updated with loop duration:", {
            mode: updatedConfig.logoMode,
            duration: updatedConfig.logoLoopDuration,
            imageCount: updatedConfig.logoImages.length
          });
          setConfig(updatedConfig);
        }
      );
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeConfigListener();
      }
    };
  }, []);

  // Setup logo rotation for loop mode
  useEffect(() => {
    if (
      !config ||
      config.logoMode !== "loop" ||
      config.logoImages.length <= 1
    ) {
      console.log("Logo rotation disabled:", {
        hasConfig: !!config,
        mode: config?.logoMode,
        imageCount: config?.logoImages.length
      });
      return;
    }

    const duration = config.logoLoopDuration * 1000;
    console.log(`Setting up logo rotation: ${config.logoLoopDuration} seconds (${duration}ms)`);
    
    const interval = setInterval(() => {
      setCurrentLogoIndex((prev) => {
        const nextIndex = (prev + 1) % config.logoImages.length;
        console.log(`Logo rotation: ${prev} -> ${nextIndex} (duration: ${config.logoLoopDuration}s)`);
        return nextIndex;
      });
    }, duration);

    return () => {
      console.log("Cleaning up logo rotation interval");
      clearInterval(interval);
    };
  }, [config?.logoMode, config?.logoImages.length, config?.logoLoopDuration]);

  const loadConfig = async () => {
    try {
      if (window.electronAPI) {
        const savedConfig = await window.electronAPI.getConfig();
        console.log("Loaded logo config:", savedConfig);
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error("Error loading logo config:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
