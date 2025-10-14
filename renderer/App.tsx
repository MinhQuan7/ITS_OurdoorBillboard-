// App.tsx - Main component of the application
import React, { useState } from "react";
import BillboardLayout from "./components/BillboardLayout";
import EraIotConfig from "./components/EraIotConfig";
import { EraIotConfig as EraIotConfigType } from "./services/eraIotService";

/**
 * App Component - Root component of the application
 * Fixed size: 384x384 pixels corresponding to LED screen
 */
const App: React.FC = () => {
  const [configUpdateTrigger, setConfigUpdateTrigger] = useState<number>(0);

  // Handle config updates from EraIotConfig component
  const handleConfigUpdated = (config: EraIotConfigType) => {
    console.log("App: E-Ra IoT config updated, triggering service refresh");
    // Trigger BillboardLayout to reinitialize service
    setConfigUpdateTrigger((prev) => prev + 1);
  };

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
      <BillboardLayout configUpdateTrigger={configUpdateTrigger} />
      <EraIotConfig onConfigUpdated={handleConfigUpdated} />
    </div>
  );
};

export default App;
