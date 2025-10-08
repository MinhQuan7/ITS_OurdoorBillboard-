// App.tsx - Main component of the application
import React from "react";
import BillboardLayout from "./components/BillboardLayout";
import EraIotConfig from "./components/EraIotConfig";

/**
 * App Component - Root component of the application
 * Fixed size: 384x384 pixels corresponding to LED screen
 */
const App: React.FC = () => {
  // Style for main container
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
      <EraIotConfig />
    </div>
  );
};

export default App;
