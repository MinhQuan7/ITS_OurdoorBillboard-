# Hướng Dẫn Setup GitHub CDN Sync System

## Bước 1: Tạo GitHub Repository

1. **Đăng nhập GitHub và tạo repository mới:**

   - Repository name: `billboard-logos-cdn`
   - Visibility: **Public** (quan trọng)
   - Initialize with README: Yes

2. **Bật GitHub Pages:**
   - Vào Settings > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

## Bước 2: Upload Files vào GitHub

### Upload manifest.json:

1. Sử dụng file `/setup-files/manifest.json` đã tạo
2. **QUAN TRỌNG:** Thay `YOUR_USERNAME` bằng username GitHub thực của bạn
3. Upload vào root của repository

### Upload logo files:

1. Tạo folder `logos/` trong repository
2. Upload các file logo:
   - `company-logo-1.png`
   - `company-logo-2.png`
   - `company-logo-3.png`

## Bước 3: Cập nhật config.json

Sau khi upload xong, thay đổi `manifestUrl` trong config.json:

**Từ:**

```json
"manifestUrl": "file:///f:/EoH%20Company/ITS_OurdoorScreen/logo-manifest.json"
```

**Thành:**

```json
"manifestUrl": "https://raw.githubusercontent.com/YOUR_USERNAME/billboard-logos-cdn/main/manifest.json"
```

## Bước 4: Test System

### 4.1 Kiểm tra Billboard App:

```bash
npm start
```

### 4.2 Mở Developer Tools:

- Press F12 trong billboard app
- Vào Console tab
- Tìm logs từ LogoManifestService:
  ```
  [LogoManifestService] Service initialized
  [LogoManifestService] Starting auto-polling every 10000ms
  [LogoManifestService] Fetching manifest from: https://...
  ```

### 4.3 Test Admin Interface:

```bash
cd admin-web
python -m http.server 8080
```

- Mở http://localhost:8080
- Vào Logo Manifest section
- Test manifest editor và preview

## Bước 5: Verification Checklist

- [ ] GitHub repository tạo thành công và public
- [ ] GitHub Pages đã được bật
- [ ] File manifest.json upload thành công
- [ ] Folder logos/ và các file logo upload thành công
- [ ] manifestUrl trong config.json đã update với GitHub URL
- [ ] Billboard app chạy không lỗi
- [ ] Browser console hiển thị LogoManifestService logs
- [ ] Admin web interface load thành công
- [ ] Có thể edit manifest trong admin interface

## URLs Cần Thiết:

1. **GitHub Repository:** `https://github.com/YOUR_USERNAME/billboard-logos-cdn`
2. **GitHub Pages:** `https://YOUR_USERNAME.github.io/billboard-logos-cdn/`
3. **Raw Manifest:** `https://raw.githubusercontent.com/YOUR_USERNAME/billboard-logos-cdn/main/manifest.json`
4. **Admin Interface:** `http://localhost:8080`

## Troubleshooting:

### Nếu không thấy logs trong console:

- Kiểm tra manifestUrl có đúng không
- Kiểm tra GitHub repository có public không
- Kiểm tra network tab xem có request đến GitHub không

### Nếu logo không hiển thị:

- Kiểm tra đường dẫn logo trong manifest.json
- Kiểm tra logo files đã upload đúng chưa
- Kiểm tra format và size của logo files
