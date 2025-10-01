# 🎯 HƯỚNG DẪN TẠO LAYOUT CHO OUTDOOR BILLBOARD APP - NGÀY 1

## 📐 Phân Tích Layout Từ Ảnh Mẫu

### Kích Thước Màn Hình LED:

- **Tổng kích thước**: 384 x 384 pixels
- **Tỷ lệ chia**: Hàng trên (75%) + Hàng dưới (25%)
- **Hàng trên chia 2 cột**: Cột trái (50%) + Cột phải (50%)

### Cấu Trúc Layout:

```
┌─────────────────────────────────────┐ 384px
│  ┌─────────────┬─────────────┐      │
│  │   Weather   │    IoT      │ 288px │ 75%
│  │   Panel     │   Panel     │      │
│  │ (192x288)   │ (192x288)   │      │
│  └─────────────┴─────────────┘      │
│  ┌───────────────────────────┐      │
│  │      Company Logo         │ 96px │ 25%
│  │       (384x96)            │      │
│  └───────────────────────────┘      │
└─────────────────────────────────────┘
```

---

## 🔧 CÁC KHÁI NIỆM CƠ BẢN ĐÃ SỬ DỤNG

### 1. **CSS Flexbox - Công Cụ Chia Layout**

#### Flexbox Container Properties:

```css
.container {
  display: flex; /* Kích hoạt flexbox */
  flex-direction: column; /* Chia theo chiều dọc (row = ngang) */
  width: 384px; /* Chiều rộng cố định */
  height: 384px; /* Chiều cao cố định */
}
```

#### Flexbox Item Properties:

```css
.item {
  flex: 1; /* Tự động chia đều không gian */
  flex: 2; /* Chiếm 2 phần so với item có flex: 1 */
  flex: 3; /* Chiếm 3 phần so với item có flex: 1 */
}
```

**Ví dụ thực tế trong project:**

- Container chính: `flex-direction: column` (chia hàng dọc)
- Hàng trên: `flex: 3` (chiếm 3/4 = 75%)
- Hàng dưới: `flex: 1` (chiếm 1/4 = 25%)

### 2. **DOM Manipulation - Tạo Elements Bằng JavaScript**

#### Tạo Element:

```javascript
// Tạo div element
const myDiv = document.createElement("div");

// Set style trực tiếp
myDiv.style.cssText = `
    width: 200px;
    height: 100px;
    background-color: blue;
`;

// Set nội dung
myDiv.textContent = "Hello World";
myDiv.innerHTML = "<h1>HTML Content</h1>";

// Thêm vào DOM
document.getElementById("root").appendChild(myDiv);
```

### 3. **Event Handling - Xử Lý Sự Kiện**

#### Click Events:

```javascript
const button = document.getElementById("my-button");

// Cách 1: addEventListener
button.addEventListener("click", function () {
  console.log("Button clicked!");
});

// Cách 2: Arrow function
button.addEventListener("click", () => {
  console.log("Button clicked with arrow function!");
});

// Cách 3: Named function
function handleClick(event) {
  console.log("Event object:", event);
  console.log("Clicked element:", event.target);
}
button.addEventListener("click", handleClick);
```

#### Keyboard Events:

```javascript
document.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "Enter":
      console.log("Enter pressed");
      break;
    case "Escape":
      console.log("Escape pressed");
      break;
    case "1":
      console.log("Number 1 pressed");
      break;
  }
});
```

---

## 🛠️ PHÂN TÍCH CODE THỰC TẾ

### 1. **Hàm `createBillboardLayout()`**

```javascript
function createBillboardLayout() {
  const root = document.getElementById("root");

  // Tạo container chính
  const container = document.createElement("div");
  container.style.cssText = `
        width: 384px;          /* Kích thước cố định */
        height: 384px;         
        display: flex;         /* Kích hoạt flexbox */
        flex-direction: column; /* Chia theo chiều dọc */
        background-color: #000; /* Nền đen */
    `;

  // Tạo 2 hàng
  const topRow = createTopRow(); // Hàng trên
  const bottomRow = createBottomRow(); // Hàng dưới

  // Thêm vào container
  container.appendChild(topRow);
  container.appendChild(bottomRow);
  root.appendChild(container);
}
```

**Giải thích:**

- `getElementById('root')`: Tìm element có id="root" trong HTML
- `createElement('div')`: Tạo thẻ div mới
- `style.cssText`: Set nhiều CSS properties cùng lúc
- `appendChild()`: Thêm element con vào element cha

### 2. **Hàm `createTopRow()` - Chia 2 Cột**

```javascript
function createTopRow() {
  const topRow = document.createElement("div");
  topRow.style.cssText = `
        flex: 3;                    /* Chiếm 3/4 chiều cao */
        display: flex;              /* Flexbox cho 2 cột */
        flex-direction: row;        /* Chia theo chiều ngang */
    `;

  // Tạo 2 cột
  const leftColumn = createWeatherPanel(); // Cột trái
  const rightColumn = createIoTPanel(); // Cột phải

  topRow.appendChild(leftColumn);
  topRow.appendChild(rightColumn);

  return topRow;
}
```

**Tại sao `flex: 3`?**

- Container chính có 2 items: topRow và bottomRow
- topRow có `flex: 3`, bottomRow có `flex: 1`
- Tỷ lệ: 3:1 = 75%:25%

### 3. **Hàm `createWeatherPanel()` - Cột Trái**

```javascript
function createWeatherPanel() {
  const weatherPanel = document.createElement("div");
  weatherPanel.style.cssText = `
        flex: 1;                    /* Chiếm 50% chiều rộng */
        background-color: #1a1a2e;  /* Màu nền xanh đậm */
        padding: 10px;              /* Khoảng cách trong */
        border: 2px solid #ff0000;  /* Viền đỏ */
        display: flex;              /* Flexbox cho nội dung */
        flex-direction: column;     /* Chia dọc */
        justify-content: center;    /* Căn giữa theo chiều dọc */
        align-items: center;        /* Căn giữa theo chiều ngang */
    `;

  // Thêm nội dung HTML
  weatherPanel.innerHTML = `
        <h3 style="font-size: 14px;">TP. THỪA THIÊN HUẾ</h3>
        <div style="font-size: 32px; font-weight: bold;">24,2°</div>
        <div style="font-size: 12px;">Độ ẩm 95% | UV Thấp</div>
    `;

  return weatherPanel;
}
```

---

## 🎮 INTERACTIVE FEATURES - TÍNH NĂNG TƯƠNG TÁC

### 1. **Click Events cho Panels**

```javascript
// Weather Panel Click
const weatherPanel = document.getElementById("weather-panel");
weatherPanel.addEventListener("click", function () {
  // Thay đổi màu nền khi click
  const currentBg = weatherPanel.style.backgroundColor;
  weatherPanel.style.backgroundColor =
    currentBg === "rgb(26, 26, 46)" ? "#2a2a4e" : "#1a1a2e";

  // Hiển thị thông báo
  showAlert("Weather data refreshed!");
});
```

### 2. **Keyboard Shortcuts**

```javascript
document.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "1":
      weatherPanel.click();
      break; // Phím 1 = click weather
    case "2":
      iotPanel.click();
      break; // Phím 2 = click IoT
    case "3":
      companyLogo.click();
      break; // Phím 3 = click logo
    case "r":
      refreshAllData();
      break; // Phím r = refresh all
  }
});
```

### 3. **Dynamic Data Update**

```javascript
function updateIoTData() {
  // Tạo dữ liệu random
  const temp = (20 + Math.random() * 10).toFixed(1);
  const humidity = (80 + Math.random() * 20).toFixed(0);

  // Update HTML content
  iotPanel.innerHTML = `
        <h3>THIẾT BỊ ĐO</h3>
        <div>Nhiệt độ: ${temp}°</div>
        <div>Độ ẩm: ${humidity}%</div>
    `;
}
```

---

## 🚀 CÁCH CHẠY VÀ TEST

### 1. **Khởi Chạy App:**

```bash
# Mở terminal trong thư mục project
cd "f:\EoH Company\ITS_OurdoorScreen"

# Chạy Electron app
npm start
```

### 2. **Test Tính Năng:**

- **Click** vào các panel để thay đổi màu
- **Phím 1, 2, 3** để tương tác nhanh
- **Phím R** để refresh data
- **F12** để mở DevTools và xem console

### 3. **Debug trong Console:**

```javascript
// Test các functions
billboardApp.updateIoTData();
billboardApp.refreshAllData();
billboardApp.showAlert("Test message");
```

---

## 📚 BÀI TẬP THỰC HÀNH

### Bài 1: Thêm Weather Alert

Tạo một alert banner màu đỏ xuất hiện khi có cảnh báo thời tiết xấu.

### Bài 2: Animation cho Logo

Thêm hiệu ứng xoay cho logo khi hover chuột.

### Bài 3: Data Counter

Thêm bộ đếm số lần click cho mỗi panel.

### Bài 4: Color Theme Switcher

Tạo button để chuyển đổi giữa dark theme và light theme.

---

## 🔜 KẾ HOẠCH NGÀY 2

1. **Chuyển đổi sang React/TypeScript**
2. **Tích hợp API thời tiết thật**
3. **Thêm MQTT cho IoT data**
4. **Tạo scheduling system**
5. **Responsive design cho các kích thước khác**

---

_File này sẽ được cập nhật khi có thêm tính năng mới trong những ngày tiếp theo._
