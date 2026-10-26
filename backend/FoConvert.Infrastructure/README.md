# FoConvert.Infrastructure

Project này đã tham chiếu `FoConvert.Application`. Đây là nơi sẽ triển khai `IPdfToWordConverter` bằng thư viện Aspose hoặc thư viện khác.

Ở bước tạo khung backend, project chưa có implementation chuyển đổi và chưa cài SDK. Không có bộ chuyển đổi giả hoặc endpoint trả kết quả giả. Khi tích hợp thư viện, lớp adapter sẽ được đặt trong `Converters/` và được đăng ký dependency injection tại Api.
