import React, { useState, useEffect, useRef } from "react";
import BannerService, {
  BannerData,
  BannerConfig,
} from "../services/bannerService";
import "./BannerDisplay.css";

interface BannerDisplayProps {
  config?: BannerConfig;
  className?: string;
  fallbackImage?: string;
  showStatus?: boolean;
}

const BannerDisplay: React.FC<BannerDisplayProps> = ({
  config,
  className = "",
  fallbackImage,
  showStatus = false,
}) => {
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const bannerServiceRef = useRef<BannerService | null>(null);
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Initialize banner service
  useEffect(() => {
    if (!config) return;

    console.log("BannerDisplay: Initializing banner service");

    try {
      bannerServiceRef.current = new BannerService(config);

      // Subscribe to banner updates
      const unsubscribeBanner = bannerServiceRef.current.onBannerUpdate(
        (data) => {
          console.log("BannerDisplay: Received banner update:", {
            hasImage: !!data.imageData,
            filename: data.filename,
            status: data.status,
          });

          setBannerData(data);
          setLastUpdate(new Date());

          // Convert Base64 to blob URL for display
          if (data.imageData && data.status === "active") {
            const url = bannerServiceRef.current?.getBannerImageUrl();
            if (url) {
              // Clean up previous URL
              if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
              }
              setImageUrl(url);
              setError(null);
            } else {
              setError("Failed to process image data");
            }
          } else {
            setImageUrl(null);
            if (data.status === "error") {
              setError("Banner error");
            }
          }

          setIsLoading(false);
        }
      );

      // Subscribe to status updates
      const unsubscribeStatus = bannerServiceRef.current.onStatusUpdate(
        (status) => {
          console.log("BannerDisplay: Status update:", status);

          if (!status.isRunning && !status.hasBanner) {
            setIsLoading(false);
            if (!error) {
              setError("No banner available");
            }
          }
        }
      );

      unsubscribeRefs.current.push(unsubscribeBanner, unsubscribeStatus);

      // Start monitoring
      bannerServiceRef.current.startBannerMonitoring().catch((err) => {
        console.error("BannerDisplay: Failed to start monitoring:", err);
        setError("Failed to connect to banner service");
        setIsLoading(false);
      });
    } catch (err: any) {
      console.error("BannerDisplay: Initialization error:", err);
      setError(`Initialization failed: ${err.message}`);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      console.log("BannerDisplay: Cleaning up");

      // Clean up image URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      // Unsubscribe from all callbacks
      unsubscribeRefs.current.forEach((unsub) => {
        try {
          unsub();
        } catch (err) {
          console.error("BannerDisplay: Error unsubscribing:", err);
        }
      });
      unsubscribeRefs.current = [];

      // Destroy banner service
      if (bannerServiceRef.current) {
        bannerServiceRef.current.destroy();
        bannerServiceRef.current = null;
      }
    };
  }, [config]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!bannerServiceRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      await bannerServiceRef.current.refreshBanner();
    } catch (err: any) {
      console.error("BannerDisplay: Manual refresh failed:", err);
      setError(`Refresh failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`banner-display loading ${className}`}>
        <div className="banner-loading">
          <div className="loading-spinner"></div>
          <p>Loading banner...</p>
        </div>
        {showStatus && (
          <div className="banner-status">
            <span className="status-indicator loading">●</span>
            <span>Connecting...</span>
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (error && !imageUrl && !fallbackImage) {
    return (
      <div className={`banner-display error ${className}`}>
        <div className="banner-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            Retry
          </button>
        </div>
        {showStatus && (
          <div className="banner-status">
            <span className="status-indicator error">●</span>
            <span>Error</span>
          </div>
        )}
      </div>
    );
  }

  // Determine which image to show
  const displayImage = imageUrl || fallbackImage;
  const displayFilename = bannerData?.filename || "Fallback Image";

  return (
    <div className={`banner-display ${className}`}>
      <div className="banner-container">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayFilename}
            className="banner-image"
            onError={(e) => {
              console.error("BannerDisplay: Image load error");
              if (imageUrl && fallbackImage) {
                // If remote image fails and we have a fallback, use it
                (e.target as HTMLImageElement).src = fallbackImage;
              } else {
                setError("Failed to load image");
              }
            }}
            onLoad={() => {
              console.log("BannerDisplay: Image loaded successfully");
              setError(null);
            }}
          />
        ) : (
          <div className="banner-placeholder">
            <div className="placeholder-icon">🖼️</div>
            <p>No banner available</p>
          </div>
        )}

        {/* Overlay for current image info */}
        {bannerData && imageUrl && (
          <div className="banner-overlay">
            <div className="banner-info">
              <span className="banner-filename">{bannerData.filename}</span>
              <span className="banner-timestamp">
                {bannerData.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {bannerData.status === "updating" && (
              <div className="updating-indicator">
                <div className="updating-spinner"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      {showStatus && (
        <div className="banner-status">
          <span
            className={`status-indicator ${bannerData?.status || "inactive"}`}
          >
            ●
          </span>
          <span className="status-text">
            {bannerData?.status === "active" && "Active"}
            {bannerData?.status === "updating" && "Updating..."}
            {bannerData?.status === "error" && "Error"}
            {bannerData?.status === "none" && "No Banner"}
            {!bannerData && "Inactive"}
          </span>

          {lastUpdate && (
            <span className="last-update">
              Last: {lastUpdate.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={handleRefresh}
            className="refresh-btn"
            disabled={isLoading}
            title="Refresh banner"
          >
            🔄
          </button>
        </div>
      )}
    </div>
  );
};

export default BannerDisplay;
