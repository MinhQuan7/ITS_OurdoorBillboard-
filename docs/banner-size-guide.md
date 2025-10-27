# Banner Logo Quảng Cáo - Hướng Dẫn Kích Thước

## Thông Số Kỹ Thuật

### Kích Thước Màn Hình LED

- **Tổng kích thước**: 384px × 384px
- **Định dạng**: Vuông (1:1 ratio)
- **Layout**: Chia thành 2 vùng chính

### Phân Bố Layout

```
┌─────────────────────────────┐
│     Weather + IoT Panel     │  ← 288px height (75%)
│         (Top Row)           │
├─────────────────────────────┤
│      Banner Logo Area       │  ← 96px height (25%)
│       (Bottom Row)          │
└─────────────────────────────┘
```

### Kích Thước Banner Logo Chính Xác

- **Width**: 384px (toàn bộ chiều rộng)
- **Height**: 96px (25% của tổng chiều cao)
- **Aspect Ratio**: 4:1 (rất rộng - banner style)
- **Không có padding**: Sử dụng toàn bộ không gian 384×96

## Yêu Cầu Ảnh Banner

### Kích Thước Khuyến Nghị

- **Tối ưu**: 384px × 96px (exact match)
- **Chấp nhận được**: 768px × 192px (scale 2x)
- **Tối đa**: 1152px × 288px (scale 3x)

### Tỷ Lệ Khung Hình

- **Banner chuẩn**: 4:1 (width:height)
- **Ví dụ kích thước tương thích**:
  - 400×100px
  - 800×200px
  - 1200×300px

### Định Dạng File

- **Khuyến nghị**: PNG, JPG, WEBP
- **Dung lượng**: < 2MB mỗi file
- **Chất lượng**: High resolution cho màn hình LED

## Chế Độ Hiển Thị

### 1. Cover Mode (Mặc định)

```css
object-fit: cover;
```

- **Ưu điểm**: Fill toàn bộ banner area
- **Nhược điểm**: Có thể crop một phần ảnh
- **Phù hợp**: Ảnh banner được thiết kế đúng tỷ lệ 4:1

### 2. Contain Mode (Preserve Aspect)

```css
object-fit: contain;
```

- **Ưu điểm**: Giữ nguyên tỷ lệ ảnh
- **Nhược điểm**: Có thể có viền trống
- **Phù hợp**: Logo vuông hoặc ảnh có tỷ lệ khác

### 3. Fill Mode (Stretch)

```css
object-fit: fill;
```

- **Ưu điểm**: Fill 100% không gian
- **Nhược điểm**: Có thể bị méo ảnh
- **Phù hợp**: Gradient, background đơn giản

## Hướng Dẫn Thiết Kế

### Template Photoshop/Figma

```
Canvas Size: 384px × 96px
Resolution: 72 DPI (screen display)
Color Mode: RGB
Background: Transparent hoặc #FF6B35 (orange brand)
```

### Safe Zone

- **Margin khuyến nghị**: 8px từ các cạnh
- **Text area an toàn**: 368px × 80px (center area)
- **Logo placement**: Center alignment

### Typography Guidelines

- **Font size tối thiểu**: 12px
- **Font weight**: Bold hoặc SemiBold
- **Color contrast**: High contrast với background
- **Line height**: 1.2 - 1.4

## Thông Số Kỹ Thuật Code

### CSS Configuration

```css
.logo-container {
  width: 384px; /* Fixed width */
  height: 96px; /* Fixed height */
  overflow: hidden;
  padding: 0; /* No padding for full coverage */
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Default: fill entire area */
  object-position: center;
}
```

### Alternative Display Modes

```css
/* Preserve aspect ratio */
.logo-image.preserve-aspect {
  object-fit: contain;
}

/* Stretch to fill */
.logo-image.banner-style {
  object-fit: fill;
}
```

## Testing Checklist

### Kiểm Tra Kích Thước

- [ ] Ảnh hiển thị đầy đủ trong 384×96px
- [ ] Không bị crop nội dung quan trọng
- [ ] Text có thể đọc được ở kích thước thực tế
- [ ] Logo/brand elements rõ ràng

### Kiểm Tra Performance

- [ ] File size < 2MB
- [ ] Load time < 1 second
- [ ] Không lag khi switch giữa các banner
- [ ] Memory usage stable trong chế độ loop

### Kiểm Tra Compatibility

- [ ] Hiển thị tốt trên LED panel thực tế
- [ ] Color rendering chính xác
- [ ] Brightness level phù hợp
- [ ] Contrast ratio đủ cao cho outdoor viewing

## Common Issues & Solutions

### Issue: Ảnh bị crop quá nhiều

**Solution**: Thiết kế lại ảnh với tỷ lệ 4:1, đặt nội dung quan trọng ở center

### Issue: Logo bị méo

**Solution**: Sử dụng `object-fit: contain` hoặc thiết kế lại với aspect ratio phù hợp

### Issue: Text quá nhỏ

**Solution**: Tăng font size, sử dụng font weight bold, kiểm tra trên màn hình thực tế

### Issue: File quá lớn

**Solution**: Optimize ảnh, sử dụng WEBP format, giảm quality nếu cần thiết
