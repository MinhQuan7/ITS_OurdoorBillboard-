# 🚀 HƯỚNG DẪN BUILD APP THÀNH FILE .EXE

## 📦 BUILD APP THÀNH EXECUTABLE

### Cách 1: Build Installer (.exe với setup)

```bash
npm run build:win
```

- Tạo file installer trong thư mục `dist/`
- User cần install app vào máy
- Tạo shortcut trên Desktop và Start Menu

### Cách 2: Build Portable (.exe chạy trực tiếp)

```bash
npm run build:portable
```

- Tạo file `ITS-Billboard-Portable.exe` trong `dist/`
- Không cần install, click đúp để chạy
- Tất cả files được đóng gói trong 1 file .exe

### Cách 3: Build Both (Khuyến nghị)

```bash
npm run dist
```

- Tạo cả 2 loại: installer + portable
- Linh hoạt trong việc triển khai

---

## 📋 CÁC BƯỚC THỰC HIỆN

### Bước 1: Chuẩn bị

```bash
cd "f:\EoH Company\ITS_OurdoorScreen"

# Đảm bảo đã cài electron-builder
npm install electron-builder --save-dev
```

### Bước 2: Build

```bash
# Build phiên bản portable (khuyến nghị cho test)
npm run build:portable
```

### Bước 3: Tìm file .exe

- Mở thư mục `dist/`
- File sẽ có tên: `ITS-Billboard-Portable.exe`
- Kích thước khoảng 150-200MB (bao gồm Electron runtime)

### Bước 4: Test

- Copy file .exe ra Desktop hoặc USB
- Double-click để chạy
- App sẽ mở với layout 384x384 như demo

---

## ⚙️ CẤU HÌNH BUILD

### Package.json đã được cấu hình:

```json
{
  "build": {
    "win": {
      "target": ["nsis", "portable"],
      "arch": ["x64"]
    },
    "portable": {
      "artifactName": "ITS-Billboard-Portable.exe"
    }
  }
}
```

### Files được đóng gói:

- `main.js` - Electron main process
- `renderer/` - UI files (HTML, CSS, JS)
- `package.json` - App metadata
- Node.js runtime + Electron framework

---

## 🎯 TÍNH NĂNG .EXE

### ✅ Standalone Application:

- Không cần cài Node.js hoặc Electron
- Chạy trên mọi Windows 10/11 x64
- Kích thước: ~150-200MB (self-contained)

### ✅ Desktop Integration:

- Icon trên Desktop (nếu dùng installer)
- Start Menu entry
- Windows Explorer integration

### ✅ Production Ready:

- Code signing (nếu có certificate)
- Auto-updater ready
- Error handling và logging

---

## 🛠️ TROUBLESHOOTING

### Lỗi "electron-builder not found":

```bash
npm install electron-builder --save-dev --force
```

### Lỗi build failed:

```bash
# Clear cache và rebuild
npm run clean
npm install
npm run build:portable
```

### File .exe không chạy:

- Kiểm tra Windows Defender/Antivirus
- Chạy as Administrator
- Kiểm tra Windows version compatibility

### App window không hiển thị:

- Kiểm tra screen resolution
- Alt+Tab để tìm window
- Check TaskManager có process không

---

## 📝 DEPLOYMENT OPTIONS

### For Development/Testing:

```bash
npm run build:portable
# Copy file .exe và test trên máy khác
```

### For Production Distribution:

```bash
npm run build:win
# Tạo installer professional với NSIS
```

### For Enterprise Deployment:

- Code signing với certificate
- Group Policy deployment
- Silent installation options

---

## 🎪 KẾT QUẢ MONG ĐỢI

Sau khi build thành công:

- ✅ File `ITS-Billboard-Portable.exe` (~150MB)
- ✅ Double-click để chạy ngay
- ✅ Window 384x384 pixels
- ✅ Đầy đủ tính năng như npm start
- ✅ Chạy offline, không cần internet

---

_Build xong là có thể copy file .exe chạy trên bất kỳ máy Windows nào!_
