// CompanyLogo.tsx - Component hiển thị logo công ty
import React from "react";

/**
 * CompanyLogo Component
 * Hiển thị logo và thông tin công ty ở khu vực dưới cùng
 * Kích thước: 384px width x 96px height (1/4 của tổng chiều cao)
 */
const CompanyLogo: React.FC = () => {
  // Style cho container chính của logo
  const logoContainerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: "#ff6b35", // Màu cam như trong ảnh mẫu
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
  };

  // Style cho logo 'C'
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

  // Style cho text container
  const textContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    color: "white",
  };

  // Style cho text chính
  const mainTextStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "bold",
    lineHeight: "1.2",
    margin: 0,
  };

  // Style cho sub text
  const subTextStyle: React.CSSProperties = {
    fontSize: "12px",
    lineHeight: "1.2",
    margin: 0,
    opacity: 0.9,
  };

  return (
    <div style={logoContainerStyle}>
      {/* Logo Circle với chữ 'C' */}
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
