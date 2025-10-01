// BillboardLayout.tsx - Layout chính cho màn hình LED 384x384
import React from "react";
import CompanyLogo from "./CompanyLogo";
import "./BillboardLayout.css";

/**
 * BillboardLayout Component
 * Chia layout thành 3 khu vực:
 * - Hàng trên: 2 cột (Weather + IoT) - chiếm 75% chiều cao
 * - Hàng dưới: Company Logo - chiếm 25% chiều cao
 */
const BillboardLayout: React.FC = () => {
  return (
    <div className="billboard-container">
      {/* Hàng trên: 2 cột */}
      <div className="top-row">
        {/* Cột trái: Weather Panel */}
        <div className="left-column">
          <h3 className="panel-title">TP. THỪA THIÊN HUẾ</h3>
          <div className="temperature-large">24,2°</div>
          <div className="info-text">Độ ẩm 95% | UV Thấp</div>
          <div className="info-text">Mưa 97% | Gió 1,6 km/h</div>
          <div className="info-text-small">Chất lượng không khí: Tốt</div>
        </div>

        {/* Cột phải: IoT Panel */}
        <div className="right-column">
          <h3 className="panel-title">THIẾT BỊ ĐO</h3>
          <div className="sensor-value">Nhiệt độ: 24,0°</div>
          <div className="sensor-value">Độ ẩm: 96%</div>
          <div className="sensor-value">PM2.5: 2,06 μg</div>
          <div className="sensor-value">PM10: 2,4 μg</div>
          <div className="status-badge">TỐT</div>
        </div>
      </div>

      {/* Hàng dưới: Company Logo */}
      <div className="bottom-row">
        <CompanyLogo />
      </div>
    </div>
  );
};

export default BillboardLayout;
