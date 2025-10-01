# 📚 HƯỚNG DẪN REACT/TYPESCRIPT CHO OUTDOOR BILLBOARD APP

## 🎯 Mục Tiêu Ngày 1

Tạo layout cơ bản 384x384 pixels và hiểu rõ cấu trúc React Component với TypeScript.

---

## 📖 KIẾN THỨC CƠ BẢN

### 1. CẤU TRÚC REACT COMPONENT

#### 1.1 Component Cơ Bản (Function Component)

```typescript
// Cú pháp cơ bản của một React Component
import React from "react";

// Interface định nghĩa kiểu dữ liệu cho Props
interface ComponentProps {
  title: string; // Thuộc tính bắt buộc
  isVisible?: boolean; // Thuộc tính tùy chọn (có dấu ?)
}

// Function Component với TypeScript
const MyComponent: React.FC<ComponentProps> = ({ title, isVisible = true }) => {
  return (
    <div className="my-component">
      <h1>{title}</h1>
      {isVisible && <p>Component đang hiển thị</p>}
    </div>
  );
};

export default MyComponent;
```

#### 1.2 Component State (useState Hook)

```typescript
import React, { useState } from "react";

const CounterComponent: React.FC = () => {
  // useState Hook để quản lý state
  const [count, setCount] = useState<number>(0);
  const [message, setMessage] = useState<string>("Hello");

  // Event Handler Function
  const handleClick = () => {
    setCount(count + 1);
    setMessage(`Clicked ${count + 1} times`);
  };

  return (
    <div>
      <p>{message}</p>
      <button onClick={handleClick}>Click me: {count}</button>
    </div>
  );
};
```

### 2. CSS STYLING TRONG REACT

#### 2.1 Inline Styles

```typescript
const MyComponent: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    width: "384px",
    height: "384px",
    backgroundColor: "#000",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: "white", fontSize: "24px" }}>Title</h1>
    </div>
  );
};
```

#### 2.2 CSS Classes

```css
/* styles.css */
.billboard-container {
  width: 384px;
  height: 384px;
  background-color: #000;
  display: flex;
  flex-direction: column;
}

.weather-panel {
  flex: 1;
  background-color: #1a1a2e;
  color: white;
  padding: 10px;
}
```

```typescript
// Component sử dụng CSS classes
import "./styles.css";

const Billboard: React.FC = () => {
  return (
    <div className="billboard-container">
      <div className="weather-panel">Weather Info</div>
    </div>
  );
};
```

### 3. LAYOUT VỚI FLEXBOX

#### 3.1 Layout 2 Hàng (Rows)

```typescript
const TwoRowLayout: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    width: "384px",
    height: "384px",
    display: "flex",
    flexDirection: "column", // Chia theo chiều dọc
  };

  const topRowStyle: React.CSSProperties = {
    flex: 2, // Chiếm 2/3 chiều cao
    backgroundColor: "#1a1a2e",
  };

  const bottomRowStyle: React.CSSProperties = {
    flex: 1, // Chiếm 1/3 chiều cao
    backgroundColor: "#ff6b35",
  };

  return (
    <div style={containerStyle}>
      <div style={topRowStyle}>Hàng trên (2/3)</div>
      <div style={bottomRowStyle}>Hàng dưới (1/3)</div>
    </div>
  );
};
```

#### 3.2 Layout 2 Cột trong Hàng Trên

```typescript
const TwoColumnInTopRow: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    width: "384px",
    height: "384px",
    display: "flex",
    flexDirection: "column",
  };

  const topRowStyle: React.CSSProperties = {
    flex: 2,
    display: "flex", // Flex container cho 2 cột
    flexDirection: "row", // Chia theo chiều ngang
  };

  const leftColumnStyle: React.CSSProperties = {
    flex: 1, // Chiếm 50% chiều rộng
    backgroundColor: "#1a1a2e",
    color: "white",
    padding: "10px",
  };

  const rightColumnStyle: React.CSSProperties = {
    flex: 1, // Chiếm 50% chiều rộng
    backgroundColor: "#16213e",
    color: "white",
    padding: "10px",
  };

  const bottomRowStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: "#ff6b35",
  };

  return (
    <div style={containerStyle}>
      <div style={topRowStyle}>
        <div style={leftColumnStyle}>
          <h3>Cột Trái</h3>
          <p>Weather Info</p>
        </div>
        <div style={rightColumnStyle}>
          <h3>Cột Phải</h3>
          <p>IoT Data</p>
        </div>
      </div>
      <div style={bottomRowStyle}>
        <p style={{ color: "white", textAlign: "center", padding: "10px" }}>
          Quảng Cáo
        </p>
      </div>
    </div>
  );
};
```

### 4. EVENT HANDLING

#### 4.1 Button Events

```typescript
const ButtonExample: React.FC = () => {
  const [isClicked, setIsClicked] = useState<boolean>(false);

  // Click Handler
  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("Button clicked!", event);
    setIsClicked(!isClicked);
  };

  // Mouse Enter/Leave Handlers
  const handleMouseEnter = () => {
    console.log("Mouse entered");
  };

  const handleMouseLeave = () => {
    console.log("Mouse left");
  };

  return (
    <button
      onClick={handleButtonClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundColor: isClicked ? "green" : "blue",
        color: "white",
        padding: "10px 20px",
        border: "none",
        cursor: "pointer",
      }}
    >
      {isClicked ? "Clicked!" : "Click Me"}
    </button>
  );
};
```

#### 4.2 Form Input Events

```typescript
const InputExample: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Ngăn form submit mặc định
    console.log("Form submitted with value:", inputValue);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter text..."
      />
      <button type="submit">Submit</button>
      <p>Current value: {inputValue}</p>
    </form>
  );
};
```

### 5. TYPESCRIPT INTERFACES CHO BILLBOARD

#### 5.1 Data Interfaces

```typescript
// Định nghĩa kiểu dữ liệu cho Weather
interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  uvIndex: number;
  windSpeed: number;
  rainChance: number;
  condition: "sunny" | "rainy" | "cloudy" | "stormy";
}

// Định nghĩa kiểu dữ liệu cho IoT Sensor
interface IoTData {
  temperature: number;
  humidity: number;
  pm25: number;
  pm10: number;
  airQuality: "good" | "moderate" | "poor" | "hazardous";
}

// Props cho Weather Component
interface WeatherPanelProps {
  data: WeatherData;
  onRefresh?: () => void;
}

// Props cho IoT Component
interface IoTPanelProps {
  data: IoTData;
  isConnected: boolean;
}
```

### 6. COMPONENT LIFECYCLE VỚI useEffect

#### 6.1 Component Mount/Unmount

```typescript
import React, { useState, useEffect } from "react";

const DataComponent: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // useEffect chạy khi component mount
  useEffect(() => {
    console.log("Component mounted");

    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fake API call
        setTimeout(() => {
          setData({ message: "Data loaded!" });
          setLoading(false);
        }, 2000);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function (chạy khi component unmount)
    return () => {
      console.log("Component will unmount");
    };
  }, []); // Empty dependency array = chỉ chạy 1 lần

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>{data?.message}</p>
    </div>
  );
};
```

---

## 🛠️ BƯỚC THỰC HÀNH

### Bước 1: Tạo Layout Container

1. Tạo component `BillboardContainer` với kích thước 384x384
2. Chia thành 2 hàng: hàng trên (chiếm 75%) và hàng dưới (25%)

### Bước 2: Chia Hàng Trên Thành 2 Cột

1. Cột trái: Weather Panel
2. Cột phải: IoT Panel

### Bước 3: Tạo Company Logo ở Hàng Dưới

1. Background màu cam (#ff6b35)
2. Logo 'C' và text company

### Bước 4: Thêm Tính Năng Tương Tác

1. Button để refresh data
2. Click event để toggle hiển thị thông tin chi tiết

---

## 📝 LƯU Ý QUAN TRỌNG

1. **Kích thước cố định**: Luôn đảm bảo container có kích thước 384x384px
2. **Responsive**: Sử dụng flex để tự động chia layout
3. **TypeScript**: Luôn định nghĩa interface cho props và data
4. **Performance**: Sử dụng useCallback và useMemo khi cần thiết
5. **Error Handling**: Luôn xử lý trường hợp lỗi và loading state

---

_Tài liệu này sẽ được cập nhật thêm khi chúng ta tiến triển trong dự án._
