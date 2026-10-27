# Lỗi production: `gdiplus.dll` trên Render

## Triệu chứng

API chạy thành công và endpoint health trả về bình thường, nhưng thao tác chuyển PDF sang Word trả về HTTP 500. Render Application Logs xuất hiện:

```text
System.TypeInitializationException: The type initializer for 'System.Drawing.Gdip' threw an exception.
System.DllNotFoundException: Unable to load shared library 'gdiplus.dll'
.../libgdiplus.dll.so: cannot open shared object file: No such file or directory
```

## Nguyên nhân

Render chạy backend trong container Linux. Gói `Aspose.PDF` dùng nhánh `System.Drawing`/GDI+, vốn phụ thuộc vào thư viện native Windows hoặc `libgdiplus`. Cài `libgdiplus` trong Docker image có thể chưa đủ vì runtime vẫn tìm các tên thư viện GDI+ không tương thích.

Đây là lỗi ở backend converter, không phải lỗi Vercel, CORS hay biến môi trường frontend.

## Cách xử lý đã áp dụng

1. Thay package `Aspose.PDF` bằng `Aspose.PDF.Drawing` trong `backend/FoConvert.Infrastructure/FoConvert.Infrastructure.csproj`.
2. Cập nhật `packages.lock.json` của `FoConvert.Infrastructure` và `FoConvert.Api`.
3. Giữ nguyên namespace và code converter vì `Aspose.PDF.Drawing` cung cấp API tương thích và dùng implementation cross-platform.
4. Commit thay đổi với commit:

```text
60e651e Use cross-platform Aspose PDF drawing adapter
```

Dockerfile vẫn cài fonts và `libgdiplus` để hỗ trợ các đường dẫn xử lý PDF cần native graphics, nhưng Docker Desktop không cần chạy khi deploy lên Render.

## Quy trình kiểm tra sau khi sửa

- Push commit mới lên branch mà Render đang theo dõi.
- Chọn **Manual Deploy → Deploy latest commit** trên Render.
- Xác nhận build log sử dụng `Aspose.PDF.Drawing`.
- Gọi `/api/health` trước, sau đó thử upload một PDF thật.
- Nếu vẫn có 500, kiểm tra log của request mới; không dựa vào log của deployment cũ.

## Ghi nhớ

Health check chỉ xác nhận web service đang sống; nó không xác nhận thư viện chuyển đổi đã khởi tạo thành công. Vì vậy cần kiểm tra cả luồng chuyển đổi sau mỗi lần thay đổi package hoặc Docker image.