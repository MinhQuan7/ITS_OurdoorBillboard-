# 🚀 HƯỚNG DẪN CHẠY ỨNG DỤNG - NGÀY 1

## 📋 BƯỚC CHUẨN BỊ

### 1. Cài Đặt Node.js và npm

```bash
# Kiểm tra đã cài Node.js chưa
node --version
npm --version

# Nếu chưa có, tải và cài từ: https://nodejs.org
```

### 2. Cài Đặt Dependencies

```bash
# Mở PowerShell tại thư mục project
cd "f:\EoH Company\ITS_OurdoorScreen"

# Cài đặt các package cần thiết
npm install
```

---

## ▶️ CHẠY ỨNG DỤNG

### Cách 1: Development Mode (Có DevTools)

```bash
npm run dev
```

### Cách 2: Production Mode

```bash
npm start
```

### Cách 3: Manual Start

```bash
# Chạy trực tiếp bằng Electron
npx electron .
```

---

## 🎯 DEMO TÍNH NĂNG

Khi app chạy, bạn sẽ thấy:

### Layout:

- **Kích thước**: 384x384 pixels (không thay đổi được)
- **Hàng trên**: 2 cột (Weather + IoT) với viền đỏ
- **Hàng dưới**: Company logo với nền cam

### Tương Tác:

- **Click cột Weather**: Đổi màu nền + hiện alert
- **Click cột IoT**: Đổi màu + update data random
- **Click logo**: Xoay 360 độ
- **Phím 1, 2, 3**: Click nhanh các panel
- **Phím R**: Refresh all data

### DevTools Console:

- **F12**: Mở Developer Tools
- **Console tab**: Xem logs và test functions

---

## 🛠️ TROUBLESHOOTING

### Lỗi "electron not found":

```bash
npm install electron --save-dev
```

### Lỗi "Cannot find module":

```bash
# Xóa node_modules và cài lại
rmdir /s node_modules
npm install
```

### App không hiển thị đúng:

- Kiểm tra file `renderer/index.html` có tồn tại
- Kiểm tra file `renderer/app.js` có tồn tại
- Xem console có lỗi JavaScript không

### Window quá nhỏ hoặc quá lớn:

- Chỉnh sửa `width` và `height` trong `main.js`
- Đảm bảo giữ tỷ lệ 1:1 (384x384)

---

## 🔍 KIỂM TRA KẾT QUẢ

App thành công khi:

- ✅ Cửa sổ có kích thước 384x384
- ✅ Layout chia 3 vùng rõ ràng
- ✅ Click panels có phản hồi
- ✅ Keyboard shortcuts hoạt động
- ✅ Console log không có lỗi

---

## 📝 GHI CHÚ CHO NGÀY 2

Sau khi đã thành thạo version JavaScript này, chúng ta sẽ:

1. Chuyển đổi sang React/TypeScript
2. Tách riêng CSS files
3. Thêm state management với Zustand
4. Tích hợp API thật

---

_Nếu có lỗi, hãy check console (F12) và báo cáo để được hỗ trợ._
