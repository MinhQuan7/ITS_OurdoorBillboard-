// App.tsx - Component chính của ứng dụng
import React from "react";
import BillboardLayout from "./components/BillboardLayout";

/**
 * App Component - Root component của ứng dụng
 * Kích thước cố định: 384x384 pixels tương ứng với màn hình LED
 */
const App: React.FC = () => {
  // Style cho container chính
  const appStyle: React.CSSProperties = {
    width: "384px",
    height: "384px",
    margin: 0,
    padding: 0,
    overflow: "hidden",
    fontFamily: "Arial, sans-serif",
  };

  return (
    <div style={appStyle}>
      <BillboardLayout />
    </div>
  );
};

export default App;
