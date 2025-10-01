# 🎛️ HƯỚNG DẪN HỆ THỐNG CONFIG CHUYÊN NGHIỆP

## 🎯 Tổng Quan Hệ Thống

Hệ thống config mới được thiết kế theo tiêu chuẩn phần mềm quảng cáo chuyên nghiệp với giao diện trắng-cam hiện đại và dễ sử dụng.

### ⚡ Tính Năng Chính

1. **Auto-Run Display**: Giao diện 384x384 chạy tự động khi khởi động
2. **F1 Config Mode**: Nhấn F1 để vào chế độ cấu hình đầy đủ
3. **Professional UI**: Thiết kế theo chuẩn enterprise software
4. **Company Logo Management**: 3 chế độ hiển thị logo linh hoạt
5. **Layout Configuration**: Tùy chỉnh vị trí các thành phần
6. **Scheduling System**: Lập lịch hiển thị theo thời gian

---

## 🚀 CÁCH SỬ DỤNG

### Khởi Động Ứng Dụng

```bash
cd "f:\EoH Company\ITS_OurdoorScreen"
npm start
```

### Chế Độ Hoạt Động

#### 1. **Display Mode (Mặc định)**

- Ứng dụng khởi động với giao diện 384x384
- Hiển thị thông tin thời tiết, IoT và logo công ty
- Chạy liên tục 24/7 cho màn hình LED

#### 2. **Config Mode**

- **Nhấn F1** từ bất kỳ đâu để vào config
- Giao diện config mở ở cửa sổ mới (1200x800)
- Giao diện chính ẩn đi khi config mở

---

## 🏢 QUẢN LÝ LOGO CÔNG TY

### 3 Chế độ Hiển Thị Logo

#### **Option 1: Fixed Single Logo**

- Hiển thị 1 logo cố định
- Phù hợp cho công ty có 1 logo chính
- Không thay đổi theo thời gian

#### **Option 2: Loop Multiple Logos**

- Xoay vòng nhiều logo liên tục
- Cấu hình thời gian hiển thị mỗi logo (1-60 giây)
- Ví dụ: 3 logo xoay vòng 5 giây/logo

#### **Option 3: Scheduled Display**

- Logo thay đổi theo lịch trình cụ thể
- Ví dụ:
  - 10:00 AM hôm nay → Logo A
  - 10:00 AM ngày mai → Logo B
- Phù hợp cho thuê quảng cáo theo giờ

### Cách Thêm Logo

1. **Click vào khu vực upload** hoặc **kéo thả file**
2. **Chọn nhiều file**: PNG, JPG, SVG
3. **Kích thước khuyến nghị**: 400x100px
4. **Preview**: Xem trước logo trong danh sách
5. **Remove**: Click nút X để xóa logo không cần

---

## 📱 CẤU HÌNH LAYOUT

### LED Module Structure

```
┌─────────────────────────────────────┐ 384px
│  ┌─────────────┬─────────────┐      │
│  │   Weather   │    IoT      │ 288px│ Module 1+2
│  │   Panel     │   Panel     │      │ (64×32 pixels)
│  │ (192x288)   │ (192x288)   │      │
│  └─────────────┴─────────────┘      │
│  ┌───────────────────────────┐      │
│  │      Company Logo         │ 96px │ Module 3
│  │       (384x96)            │      │ (64×32 pixels)
│  └───────────────────────────┘      │
└─────────────────────────────────────┘
```

### Drag & Drop Configuration

- **Visual Editor**: Kéo thả các thành phần trong preview
- **Real-time Update**: Thay đổi áp dụng ngay lập tức
- **Pixel Perfect**: Vị trí chính xác đến từng pixel

---

## ⏰ HỆ THỐNG SCHEDULING

### Schedule Rules

Mỗi rule bao gồm:

- **Time**: Giờ:phút hiển thị (HH:MM)
- **Logo**: Chọn logo từ danh sách đã upload
- **Days**: Ngày áp dụng (Daily/Weekdays/Weekends)

### Ví Dụ Schedule

```
10:00 AM → Logo Công ty A (Daily)
02:00 PM → Logo Công ty B (Weekdays)
06:00 PM → Logo Công ty C (Weekends)
```

### Auto Recovery

- **Mất điện**: App tự khởi động khi có điện
- **Time Sync**: Tự động đồng bộ thời gian
- **Fallback**: Hiển thị logo mặc định nếu lỗi

---

## 🎨 THIẾT KẾ GIAO DIỆN

### Professional Theme

- **Primary Color**: Orange (#FF6B35)
- **Background**: White/Light Gray
- **Typography**: Segoe UI (Windows standard)
- **Shadows**: Subtle elevation
- **Icons**: Minimalist, consistent

### Layout Structure

```
├── Sidebar Navigation (280px)
│   ├── Logo Header
│   ├── Navigation Menu
│   └── Quick Actions
├── Main Content Area
│   ├── Content Header
│   ├── Configuration Cards
│   └── Preview Area
└── Action Bar (Fixed Bottom)
    ├── Status Info
    └── Save/Cancel Buttons
```

### Responsive Design

- **Desktop**: Full 1200x800 config window
- **Tablet**: Responsive sidebar collapse
- **Mobile**: Stack layout (future)

---

## 🔧 TECHNICAL SPECS

### File Structure

```
renderer/
├── config.html          # Config interface HTML
├── config.js            # Config logic & UI
├── billboard.js         # Enhanced main display
└── index.html           # Main display HTML

main.js                  # Electron main process
preload.js              # IPC bridge
config.json             # Saved configuration
```

### Configuration Schema

```json
{
  "logoMode": "fixed|loop|scheduled",
  "logoImages": [
    {
      "name": "company-a.png",
      "path": "/path/to/image",
      "size": 12345,
      "type": "image/png"
    }
  ],
  "logoLoopDuration": 5,
  "layoutPositions": {
    "weather": { "x": 0, "y": 0, "width": 192, "height": 288 },
    "iot": { "x": 192, "y": 0, "width": 192, "height": 288 },
    "logo": { "x": 0, "y": 288, "width": 384, "height": 96 }
  },
  "schedules": [
    {
      "time": "10:00",
      "logoIndex": 0,
      "days": "daily"
    }
  ]
}
```

### IPC Communication

- **Secure Bridge**: preload.js exposes safe APIs
- **Real-time Sync**: Config changes apply immediately
- **File Operations**: Native file dialog integration
- **Auto-save**: Configuration persisted to JSON

---

## ✅ TESTING & VALIDATION

### Kiểm Tra Chức Năng

1. **Display Mode**

   - [x] App khởi động với 384x384
   - [x] Weather/IoT panels hiển thị
   - [x] Logo section hoạt động

2. **Config Mode**

   - [x] F1 mở config window
   - [x] Main display ẩn khi config mở
   - [x] Config đóng quay về display

3. **Logo Management**

   - [x] Upload multiple images
   - [x] Preview trong grid
   - [x] Remove unwanted logos
   - [x] Drag & drop support

4. **Mode Switching**

   - [x] Fixed mode: 1 logo static
   - [x] Loop mode: rotation working
   - [x] Scheduled mode: time-based

5. **Data Persistence**
   - [x] Config saves to JSON
   - [x] Config loads on restart
   - [x] Logo paths preserved

---

## 🛠️ DEPLOYMENT READY

### For Production

```bash
# Build executable
npm run pack

# Generated file:
# dist/its-outdoor-billboard-app-win32-x64/
# └── its-outdoor-billboard-app.exe
```

### Auto-Start Setup

- Windows Registry entry
- System startup integration
- Service mode capability
- Crash recovery

### Enterprise Features

- Multi-display support
- Remote configuration
- Central management
- Usage analytics

---

## 🎉 KẾT QUẢ ĐẠT ĐƯỢC

✅ **Professional Config System** - Giao diện chuẩn enterprise
✅ **F1 Toggle Mode** - Chuyển đổi nhanh giữa display/config
✅ **Flexible Logo Management** - 3 chế độ hiển thị linh hoạt  
✅ **Auto Recovery** - Khởi động lại sau mất điện
✅ **Real-time Preview** - Xem trước thay đổi ngay lập tức
✅ **Time-based Scheduling** - Lập lịch theo giờ chính xác
✅ **Clean UI/UX** - Thiết kế trắng-cam chuyên nghiệp

**Hệ thống đã sẵn sàng cho việc triển khai thương mại!**
