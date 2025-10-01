Instruction Chuẩn cho Copilot/Dev Team (Phần chuyên nghiệp, tập trung vào kỹ thuật và yêu cầu dự án)
Chat và giải thích trong readme thì tiếng việt còn khi code và comment trong code thì sử dụng tiếng anh

# 🎯 HƯỚNG DẪN HỌC TẬP NGÀY 1 - OUTDOOR BILLBOARD APP

## Mục Tiêu Ngày Đầu

Tạo foundation cho dự án Mini Desktop App hiển thị thông tin lên màn hình LED 384x384 pixels.

---

## ✅ ĐÃ HOÀN THÀNH

### 📁 Cấu Trúc Project

```
ITS_OurdoorScreen/
├── main.js                          # Electron Main Process
├── package.json                     # Project configuration
├── tsconfig.json                    # TypeScript config
├── renderer/
│   ├── index.html                   # Entry HTML file
│   ├── app.js                       # JavaScript version (ngày 1)
│   ├── App.tsx                      # React version (chuẩn bị ngày 2)
│   └── components/
│       ├── BillboardLayout.tsx      # Layout chính
│       └── CompanyLogo.tsx          # Component logo
├── docs/
│   ├── react-typescript-guide.md   # Hướng dẫn React/TS chi tiết
│   └── layout-guide-day1.md        # Hướng dẫn layout
└── README-HOW-TO-RUN.md            # Hướng dẫn chạy app
```

### 🎨 Layout Đã Triển Khai

- **Kích thước cố định**: 384x384 pixels
- **Chia 3 khu vực**:
  - Hàng trên (75%): Weather Panel + IoT Panel
  - Hàng dưới (25%): Company Logo
- **Tương tác**: Click events, keyboard shortcuts
- **Responsive**: Flexbox layout tự động chia tỷ lệ

### 🛠️ Công Nghệ Sử Dụng

- **Electron**: Desktop app framework
- **Vanilla JavaScript**: Version đầu tiên để học cơ bản
- **Flexbox**: Layout system
- **DOM Manipulation**: Tạo elements động
- **Event Handling**: User interactions

---

## 🚀 CÁCH CHẠY

### Bước 1: Cài Dependencies

```bash
cd "f:\EoH Company\ITS_OurdoorScreen"
npm install
```

### Bước 2: Chạy App

```bash
npm run dev    # Development mode với DevTools
# hoặc
npm start      # Production mode
```

---

## 🎮 TÍNH NĂNG DEMO

### Tương Tác Chuột:

- Click **Weather Panel**: Đổi màu nền
- Click **IoT Panel**: Update data random
- Click **Company Logo**: Xoay 360°

### Keyboard Shortcuts:

- **Phím 1**: Click Weather Panel
- **Phím 2**: Click IoT Panel
- **Phím 3**: Click Company Logo
- **Phím R**: Refresh all data

### Developer Console:

```javascript
// Test functions trong console (F12)
billboardApp.updateIoTData();
billboardApp.refreshAllData();
billboardApp.showAlert("Test message");
```

---

## 📚 TÀI LIỆU HỌC TẬP

### 1. Kiến Thức Cơ Bản React/TypeScript

📖 **File**: `docs/react-typescript-guide.md`

- Cú pháp React Components
- TypeScript Interfaces
- CSS Styling methods
- Event Handling
- Lifecycle với useEffect

### 2. Phân Tích Layout Chi Tiết

📖 **File**: `docs/layout-guide-day1.md`

- Flexbox properties
- DOM manipulation
- Interactive features
- Debugging techniques

### 3. Hướng Dẫn Troubleshooting

📖 **File**: `README-HOW-TO-RUN.md`

- Cài đặt và chạy app
- Xử lý lỗi thường gặp
- Kiểm tra kết quả

---

## 🔜 KẾ HOẠCH NGÀY 2

### React/TypeScript Migration:

- Chuyển từ vanilla JS sang React
- Implement TypeScript interfaces
- State management với Zustand
- Component-based architecture

### API Integration:

- Weather API connection
- MQTT cho IoT data
- Real-time data updates
- Error handling

### Advanced Features:

- Scheduling system với node-cron
- Auto-refresh mechanisms
- Data validation
- Performance optimization

---

## 💡 TIPS HỌC TẬP

1. **Hiểu Layout trước khi code**: Vẽ sơ đồ layout trên giấy
2. **Test từng phần nhỏ**: Console.log để debug
3. **Thực hành nhiều**: Thay đổi colors, sizes, positions
4. **Đọc docs**: Tham khảo các file hướng dẫn đã tạo
5. **Experiment**: Thử các event handlers khác nhau

---

## ✅ CHECKLIST HOÀN THÀNH NGÀY 1

- [x] Tạo cấu trúc project cơ bản
- [x] Thiết lập Electron main process
- [x] Implement layout 384x384 với 3 khu vực
- [x] Tạo interactive features
- [x] Viết documentation đầy đủ
- [x] Test app chạy thành công
- [x] Chuẩn bị foundation cho ngày 2

---

_Ngày 1 đã hoàn thành! Sẵn sàng cho việc nâng cấp lên React/TypeScript ở ngày 2._
