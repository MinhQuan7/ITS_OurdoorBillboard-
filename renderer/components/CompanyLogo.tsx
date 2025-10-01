// CompanyLogo.tsx - Component for displaying company logo
import React from "react";

/**
 * CompanyLogo Component
 * Displays logo and company information in the bottom area
 * Size: 384px width x 96px height (1/4 of total height)
 */
const CompanyLogo: React.FC = () => {
  // Style for main logo container
  const logoContainerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: "#ff6b35", // Orange color as in sample image
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
  };

  // Style for logo 'C'
  const logoCircleStyle: React.CSSProperties = {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "12px",
    fontSize: "36px",
    fontWeight: "bold",
    color: "#ff6b35",
  };

  // Style for text container
  const textContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    color: "white",
  };

  // Style for main text
  const mainTextStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "bold",
    lineHeight: "1.2",
    margin: 0,
  };

  // Style for sub text
  const subTextStyle: React.CSSProperties = {
    fontSize: "12px",
    lineHeight: "1.2",
    margin: 0,
    opacity: 0.9,
  };

  return (
    <div style={logoContainerStyle}>
      {/* Logo Circle with letter 'C' */}
      <div style={logoCircleStyle}>C</div>

      {/* Text Container */}
      <div style={textContainerStyle}>
        <div style={mainTextStyle}>CÔNG TY</div>
        <div style={subTextStyle}>VÌ CUỘC SỐNG TỐT ĐẸP HƠN</div>
      </div>
    </div>
  );
};

export default CompanyLogo;
