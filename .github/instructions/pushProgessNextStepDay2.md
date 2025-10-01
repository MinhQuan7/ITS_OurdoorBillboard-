Prompt Chuyên Nghiệp Đẩy Nhanh Tốc Độ (Cho Ngày Sau)
Mục tiêu: Hoàn thiện giao diện, tích hợp Realtime Data (MQTT) và State Management (Zustand).
Instruction Chuẩn cho Copilot/Dev Team (Phần chuyên nghiệp, tập trung vào kỹ thuật và yêu cầu dự án)
Chat và giải thích trong readme thì tiếng việt còn khi code và comment trong code thì sử dụng tiếng anh

📝 BƯỚC 2: Hoàn Thiện Giao Diện, Data & Realtime
Yêu cầu 2.1: Xây dựng State Management (/renderer/store/dataStore.ts)
Sử dụng Zustand để tạo store chứa các trường dữ liệu sau (dùng TypeScript interfaces):

weather: { city: string, temp: number, humidity: number, rain: number, uv: string, wind: string, quality: string }

iot: { deviceTemp: number, deviceHumidity: number, pm2_5: number, pm10: number, deviceStatus: 'TỐT' | 'XẤU' }

Tạo các hàm setWeather và setIoTData để cập nhật trạng thái.

Yêu cầu 2.2: Triển khai MQTT Service (/services/mqttService.ts)
Cài đặt mqtt và tạo service để kết nối tới một broker giả lập (hoặc broker thật nếu có).

Tạo hàm connectAndSubscribe() và chỉ log dữ liệu nhận được từ topic mẫu.

Sử dụng IPC (Inter-Process Communication) để gửi dữ liệu từ Main Process (nơi mqttService chạy, nếu chọn) hoặc trực tiếp cập nhật Zustand store (nếu chạy ở Renderer).

Yêu cầu 2.3: Xây dựng Component Hiển Thị Dữ Liệu
WeatherPanel.tsx: Hiển thị phần "TP. THỪA THIÊN HUẾ" và các thông số thời tiết.

IoTPanel.tsx: Hiển thị phần "THIẾT BỊ ĐO" và các thông số IoT (Nhiệt độ, Độ ẩm, PM2.5, PM10).

Cả hai component phải sử dụng data từ Zustand store và tự động cập nhật khi data thay đổi.

Yêu cầu 2.4: Hoàn thiện Layout (App.tsx)
Tạo layout tổng thể 384x384, chia thành 3 phần chính (theo ảnh mẫu):

Header (Weather + IoT Data)

Alert Banner

Footer (Company Logo/Ad Player)

Giải thích chi tiết trong /Readme/Zustand_MQTT_Integration.md về luồng dữ liệu (Data Flow) từ MQTT -> Service -> Zustand Store -> React Component.
