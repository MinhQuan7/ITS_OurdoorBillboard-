// BillboardLayout.tsx - Main layout for 384x384 LED screen
import React from "react";
import WeatherPanel from "./WeatherPanel";
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
      {/* Top row: Single unified weather panel - no columns */}
      <div className="top-row">
        {/* Unified Weather Panel with integrated IoT data */}
        <WeatherPanel className="unified-weather" />
      </div>

      {/* Bottom row: Company Logo */}
      <div className="bottom-row">
        <CompanyLogo />
      </div>
    </div>
  );
};

export default BillboardLayout;
