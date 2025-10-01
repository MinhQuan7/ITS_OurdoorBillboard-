// BillboardLayout.tsx - Main layout for 384x384 LED screen
import React from "react";
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
        {/* Left column: Weather Panel */}
        <div className="left-column">
          <h3 className="panel-title">TP. THỪA THIÊN HUẾ</h3>
          <div className="temperature-large">24,2°</div>
          <div className="info-text">Độ ẩm 95% | UV Thấp</div>
          <div className="info-text">Mưa 97% | Gió 1,6 km/h</div>
          <div className="info-text-small">Chất lượng không khí: Tốt</div>
        </div>

        {/* Right column: IoT Panel */}
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
