// app.js - JavaScript version of React App
// Clean architecture using React components with proper logo management

class WeatherPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      weatherData: {
        city: "TP. THỪA THIÊN HUẾ",
        temperature: "24,2",
        lowTemp: "-29,7",
        humidity: "95",
        uvIndex: "Thấp",
        rainChance: "97",
        windSpeed: "1,6",
        airQuality: "Tốt",
      },
    };
  }

  componentDidMount() {
    this.weatherInterval = setInterval(() => {
      this.updateWeatherData();
    }, 300000);
  }

  componentWillUnmount() {
    if (this.weatherInterval) {
      clearInterval(this.weatherInterval);
    }
  }

  updateWeatherData() {
    const newData = {
      ...this.state.weatherData,
      temperature: (20 + Math.random() * 15).toFixed(1),
      humidity: (70 + Math.random() * 30).toFixed(0),
      rainChance: Math.floor(Math.random() * 100),
      windSpeed: (Math.random() * 5).toFixed(1),
    };

    this.setState({
      weatherData: newData,
    });
  }

  render() {
    const { weatherData } = this.state;

    const panelStyle = {
      flex: 1,
      backgroundColor: "#1a1a2e",
      padding: "10px",
      border: "2px solid #ff0000",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      color: "white",
    };

    return React.createElement(
      "div",
      {
        style: panelStyle,
        onClick: () => this.updateWeatherData(),
      },
      React.createElement(
        "h3",
        {
          style: {
            fontSize: "14px",
            marginBottom: "8px",
            marginTop: 0,
          },
        },
        weatherData.city
      ),
      React.createElement(
        "div",
        { style: { fontSize: "32px", fontWeight: "bold" } },
        `${weatherData.temperature}°`
      ),
      React.createElement(
        "div",
        { style: { fontSize: "12px" } },
        `${weatherData.lowTemp}°`
      ),
      React.createElement(
        "div",
        { style: { fontSize: "12px" } },
        `Độ ẩm ${weatherData.humidity}% | UV ${weatherData.uvIndex}`
      ),
      React.createElement(
        "div",
        { style: { fontSize: "12px" } },
        `Mưa ${weatherData.rainChance}% | Gió ${weatherData.windSpeed} km/h`
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "10px",
            marginTop: "5px",
          },
        },
        `Chất lượng không khí: ${weatherData.airQuality}`
      )
    );
  }
}

class IoTPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sensorData: {
        temperature: "24,0",
        humidity: "96",
        pm25: "2,06",
        pm10: "2,4",
        status: "TỐT",
      },
    };
  }

  componentDidMount() {
    this.iotInterval = setInterval(() => {
      this.updateIoTData();
    }, 30000);
  }

  componentWillUnmount() {
    if (this.iotInterval) {
      clearInterval(this.iotInterval);
    }
  }

  updateIoTData() {
    const newData = {
      temperature: (20 + Math.random() * 10).toFixed(1),
      humidity: (80 + Math.random() * 20).toFixed(0),
      pm25: (1 + Math.random() * 3).toFixed(2),
      pm10: (2 + Math.random() * 4).toFixed(1),
      status: "TỐT",
    };

    this.setState({
      sensorData: newData,
    });
  }

  render() {
    const { sensorData } = this.state;

    const panelStyle = {
      flex: 1,
      backgroundColor: "#16213e",
      padding: "10px",
      border: "2px solid #ff0000",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      color: "white",
    };

    return React.createElement(
      "div",
      {
        style: panelStyle,
        onClick: () => this.updateIoTData(),
      },
      React.createElement(
        "h3",
        {
          style: {
            fontSize: "14px",
            marginBottom: "8px",
            marginTop: 0,
          },
        },
        "THIẾT BỊ ĐO"
      ),
      React.createElement(
        "div",
        { style: { fontSize: "12px", marginBottom: "4px" } },
        `Nhiệt độ: ${sensorData.temperature}°`
      ),
      React.createElement(
        "div",
        { style: { fontSize: "12px", marginBottom: "4px" } },
        `Độ ẩm: ${sensorData.humidity}%`
      ),
      React.createElement(
        "div",
        { style: { fontSize: "12px", marginBottom: "4px" } },
        `PM2.5: ${sensorData.pm25} μg`
      ),
      React.createElement(
        "div",
        { style: { fontSize: "12px", marginBottom: "4px" } },
        `PM10: ${sensorData.pm10} μg`
      ),
      React.createElement(
        "div",
        {
          style: {
            fontSize: "10px",
            backgroundColor: "green",
            padding: "2px 6px",
            borderRadius: "3px",
            marginTop: "5px",
          },
        },
        sensorData.status
      )
    );
  }
}

class CompanyLogo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      config: null,
      currentLogoIndex: 0,
    };
    this.logoRotationInterval = null;
  }

  async componentDidMount() {
    await this.loadConfig();
    this.startLogoRotation();

    if (window.electronAPI && window.electronAPI.onConfigUpdated) {
      window.electronAPI.onConfigUpdated((event, newConfig) => {
        console.log("Config updated:", newConfig);
        this.setState({ config: newConfig }, () => {
          this.startLogoRotation();
        });
      });
    }
  }

  componentWillUnmount() {
    this.stopLogoRotation();

    if (window.electronAPI && window.electronAPI.removeConfigListener) {
      window.electronAPI.removeConfigListener();
    }
  }

  async loadConfig() {
    try {
      if (window.electronAPI) {
        const config = await window.electronAPI.getConfig();
        this.setState({ config });
      } else {
        this.setState({
          config: {
            logoMode: "fixed",
            logoImages: [],
            logoLoopDuration: 5,
          },
        });
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }

  startLogoRotation() {
    this.stopLogoRotation();

    const { config } = this.state;
    if (
      config &&
      config.logoMode === "loop" &&
      config.logoImages &&
      config.logoImages.length > 1
    ) {
      const duration = (config.logoLoopDuration || 5) * 1000;

      this.logoRotationInterval = setInterval(() => {
        this.setState((prevState) => ({
          currentLogoIndex:
            (prevState.currentLogoIndex + 1) % config.logoImages.length,
        }));
      }, duration);
    }
  }

  stopLogoRotation() {
    if (this.logoRotationInterval) {
      clearInterval(this.logoRotationInterval);
      this.logoRotationInterval = null;
    }
  }

  getCurrentLogo() {
    const { config, currentLogoIndex } = this.state;

    if (!config || !config.logoImages || config.logoImages.length === 0) {
      return null;
    }

    switch (config.logoMode) {
      case "fixed":
        return config.logoImages[0];

      case "loop":
        return config.logoImages[currentLogoIndex % config.logoImages.length];

      case "scheduled":
        return this.getScheduledLogo();

      default:
        return config.logoImages[0];
    }
  }

  getScheduledLogo() {
    const { config } = this.state;
    const now = new Date();
    const currentTime =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    const matchingSchedule = config.schedules?.find((schedule) => {
      return schedule.time === currentTime;
    });

    if (matchingSchedule && config.logoImages[matchingSchedule.logoIndex]) {
      return config.logoImages[matchingSchedule.logoIndex];
    }

    return config.logoImages[0];
  }

  renderCustomLogo(logo) {
    return React.createElement("img", {
      src: `file://${logo.path}`,
      alt: logo.name,
      style: {
        maxWidth: "100%",
        maxHeight: "80px",
        objectFit: "contain",
        borderRadius: "4px",
      },
      onError: (e) => {
        console.error("Failed to load logo:", logo.path);
        e.target.style.display = "none";
      },
    });
  }

  renderDefaultLogo() {
    return [
      React.createElement(
        "div",
        {
          key: "logo-circle",
          style: {
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
            cursor: "pointer",
          },
        },
        "C"
      ),
      React.createElement(
        "div",
        {
          key: "text-container",
          style: {
            display: "flex",
            flexDirection: "column",
            color: "white",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              fontSize: "18px",
              fontWeight: "bold",
              lineHeight: "1.2",
              margin: 0,
            },
          },
          "CÔNG TY"
        ),
        React.createElement(
          "div",
          {
            style: {
              fontSize: "12px",
              lineHeight: "1.2",
              margin: 0,
              opacity: 0.9,
            },
          },
          "VÌ CUỘC SỐNG TỐT ĐẸP HƠN"
        )
      ),
    ];
  }

  render() {
    const currentLogo = this.getCurrentLogo();

    const containerStyle = {
      flex: 1,
      backgroundColor: "#ff6b35",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
      position: "relative",
      overflow: "hidden",
    };

    return React.createElement(
      "div",
      { style: containerStyle },
      currentLogo
        ? this.renderCustomLogo(currentLogo)
        : this.renderDefaultLogo()
    );
  }
}

class BillboardLayout extends React.Component {
  render() {
    const containerStyle = {
      width: "384px",
      height: "384px",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#000",
      fontFamily: "Arial, sans-serif",
      margin: 0,
      padding: 0,
    };

    const topRowStyle = {
      flex: 3,
      display: "flex",
      flexDirection: "row",
    };

    return React.createElement(
      "div",
      { style: containerStyle },
      React.createElement(
        "div",
        { style: topRowStyle },
        React.createElement(WeatherPanel),
        React.createElement(IoTPanel)
      ),
      React.createElement(CompanyLogo)
    );
  }
}

class App extends React.Component {
  render() {
    const appStyle = {
      width: "384px",
      height: "384px",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      fontFamily: "Arial, sans-serif",
    };

    return React.createElement(
      "div",
      { style: appStyle },
      React.createElement(BillboardLayout)
    );
  }
}

// Initialize React App
document.addEventListener("DOMContentLoaded", () => {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(App));

  console.log("Billboard React App initialized with logo management");
});
