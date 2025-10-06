// BillboardLayout.tsx - Main layout for 384x384 LED screen
import React from "react";
// Temporarily disabled debug component for production
// import WeatherDebug from "./WeatherDebug";
import CompanyLogo from "./CompanyLogo";
import "./BillboardLayout.css";

/**
 * BillboardLayout Component
 * Divides layout into 3 areas:
 * - Top row: 2 columns (Weather + IoT) - takes 75% height
 * - Bottom row: Company Logo - takes 25% height
 */
const BillboardLayout: React.FC = () => {
  return (
    <div className="billboard-container">
      {/* Top row: 2 columns */}
      <div className="top-row">
        {/* Left column: Real Weather Panel with API */}
        <WeatherPanel className="left-column" />

        {/* Right column: IoT Panel (keep existing data as requested) */}
        <div className="right-column">
          <h3 className="panel-title">THIẾT BỊ ĐO</h3>
          <div className="sensor-value">Nhiệt độ: 24,0°</div>
          <div className="sensor-value">Độ ẩm: 96%</div>
          <div className="sensor-value">PM2.5: 2,06 μg</div>
          <div className="sensor-value">PM10: 2,4 μg</div>
          <div className="status-badge">TỐT</div>
        </div>
      </div>

      {/* Bottom row: Company Logo */}
      <div className="bottom-row">
        <CompanyLogo />
      </div>
    </div>
  );
};

export default BillboardLayout;
