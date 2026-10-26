# Bước 4 — Chuyển PDF thành Word qua API

## Mục tiêu

React gửi PDF tới ASP.NET Core, Application kiểm tra quy tắc, adapter Aspose chuyển PDF sang DOCX và trình duyệt tải kết quả. Mã của SDK chỉ xuất hiện trong `Infrastructure`.

## Luồng tổng thể

```text
React (FormData)
  → POST /api/convert/pdf-to-word
  → API đọc multipart/form-data
  → ConvertPdfToWordService kiểm tra file và quy tắc
  → IPdfToWordConverter (hợp đồng Application)
  → AsposePdfToWordConverter (adapter Infrastructure)
  → bytes DOCX
  → API trả file tải xuống
```

## 1. Interface và Adapter

`IPdfToWordConverter` ở `backend/FoConvert.Application/Interfaces` khai báo điều Application cần: nhận `Stream`, chế độ chuyển đổi và trả bytes. Nó không đề cập Aspose, HTTP hay `IFormFile`.

`AsposePdfToWordConverter` ở `backend/FoConvert.Infrastructure/Converters` triển khai interface ấy. Đây là **Adapter pattern**: chuyển hợp đồng chung của FoConvert thành lời gọi SDK Aspose. Nếu sau này thay SDK, ta tạo adapter khác mà không để Application tham chiếu thư viện mới.

`Program.cs` là **composition root**. Nó đọc cấu hình và đăng ký `IPdfToWordConverter` với implementation Aspose. Khi endpoint yêu cầu `ConvertPdfToWordService`, DI tạo service cùng dependency của nó. Endpoint không tự tạo converter.

```csharp
builder.Services.AddSingleton<IPdfToWordConverter>(_ =>
    new AsposePdfToWordConverter(new AsposePdfOptions { ... }));
builder.Services.AddScoped<ConvertPdfToWordService>();
```

Converter là singleton vì nó giữ một cổng semaphore dùng chung để giới hạn xử lý đồng thời. Service Application scoped theo request. Policy là singleton vì chỉ chứa cấu hình đọc.

## 2. Application giữ quy tắc gì?

Mở `ConvertPdfToWordService.cs`. Trước khi gọi engine, service kiểm tra chế độ, phần mở rộng `.pdf`, file rỗng, dung lượng, nội dung bắt đầu bằng `%PDF-` và tên file đầu ra an toàn. Luồng được đọc theo từng khối và giới hạn dung lượng được kiểm tra lại.

Kiểm tra ở backend là bắt buộc dù React đã kiểm tra: người dùng có thể gọi API trực tiếp, nên không thể tin dữ liệu từ trình duyệt.

## 3. API nhận multipart và trả file

`ConversionEndpoints.cs` đọc trường `file` và `mode` từ `multipart/form-data`. `editable` ánh xạ sang `ConversionMode.Editable`, còn `layout` ánh xạ sang `PreserveLayout`.

Khi thành công, API trả bytes với MIME type của DOCX và `Content-Disposition` chứa tên file tải về. Khi lỗi, `ConversionExceptionHandler` chuyển lỗi thành HTTP status và JSON Problem Details. Vượt số trang trả 422; vượt dung lượng trả 413. React trình bày trường `detail`.

## 4. Chế độ chuyển đổi

- **Dễ chỉnh sửa (`editable`)** dùng Aspose `EnhancedFlow`, ưu tiên luồng nội dung dễ chỉnh sửa.
- **Giữ bố cục (`layout`)** dùng `Textbox`, ưu tiên vị trí các khối nội dung.

Chuyển đổi PDF sang Word không thể bảo đảm bố cục hoàn hảo cho mọi file. Mở DOCX đầu ra và kiểm tra bảng, cột, font và ngắt trang quan trọng.

## 5. Cấu hình và bản dùng thử

`appsettings.json` có `Conversion:MaxFileSizeMb`, `Conversion:MaxPages` và `Conversion:LicensePath`. Không cấu hình license thì adapter báo engine là bản dùng thử, tối đa 4 trang. Với license hợp lệ, số trang được lấy từ cấu hình (tối đa 500 trong ứng dụng này).

Bản dùng thử Aspose có watermark và giới hạn 4 trang. OCR chưa được bật; PDF scan chỉ có ảnh sẽ báo cần OCR thay vì tạo DOCX trống.

Không commit file license. Có thể đặt biến môi trường `Conversion__LicensePath` trỏ tới file license cục bộ; dấu `__` tương ứng dấu `:` trong khóa cấu hình .NET.

## 6. React gọi API

`src/services/conversionApi.ts` tập trung lời gọi HTTP:

- `getConversionOptions()` lấy cấu hình từ `/api/conversion-options`.
- `convertPdfToWord()` đóng gói file và chế độ trong `FormData`, gọi POST, đọc DOCX dạng `Blob` và tên file từ header.

Không tự đặt `Content-Type` cho `FormData`: trình duyệt phải tự tạo multipart boundary. `App.tsx` tạo object URL cho Blob để cung cấp liên kết tải xuống, rồi thu hồi URL khi kết quả bị thay thế hoặc component unmount.

`App.tsx` giữ state vì file, chế độ, trạng thái đang chạy, lỗi và kết quả ảnh hưởng nhiều thành phần. `PdfUpload` chỉ nhận callback/cấu hình bằng props; component này không tự gọi API. Đây là cách tách giao diện nhận file khỏi nghiệp vụ gọi backend.

## 7. Chạy ứng dụng

Terminal backend:

```powershell
dotnet run --project backend/FoConvert.Api --launch-profile http
```

Terminal frontend:

```powershell
cd frontend
npm run dev
```

Mở `http://localhost:5173`, chọn PDF có lớp văn bản, thử hai chế độ và mở DOCX tải về. Vite proxy chuyển `/api` tới cổng 5080.

## 8. Tự gọi API

```powershell
curl.exe -F "file=@C:\path\sample.pdf" -F "mode=editable" http://localhost:5080/api/convert/pdf-to-word -o sample.docx
```

Thay `editable` bằng `layout` để thử chế độ còn lại. Mỗi request nhận một file.

## 9. Mở Swagger để khám phá API

FoConvert dùng `Swashbuckle.AspNetCore` để sinh tài liệu OpenAPI và giao diện Swagger UI. Cấu hình nằm trong `backend/FoConvert.Api/Program.cs`:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
```

Swagger UI chỉ được bật khi API chạy ở môi trường `Development`:

```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "FoConvert API v1"));
}
```

Chạy API từ thư mục gốc:

```powershell
dotnet run --project backend/FoConvert.Api --launch-profile http
```

Sau đó mở:

- `http://127.0.0.1:5080/swagger` — giao diện tương tác.
- `http://127.0.0.1:5080/swagger/v1/swagger.json` — tài liệu OpenAPI dạng JSON.

Endpoint `POST /api/convert/pdf-to-word` hiển thị hai field multipart là `file` và `mode`. Chọn `editable` hoặc `layout`, rồi nhấn **Execute**. Swagger là công cụ dành cho developer; frontend vẫn gọi API thông qua `src/services/conversionApi.ts`.

## 10. Kiểm tra đã thực hiện

- `dotnet build FoConvert.sln --nologo`: thành công, 0 warning, 0 error.
- `npm run build`: thành công.
- Health/options hoạt động trực tiếp; options cũng hoạt động qua Vite proxy.
- PDF mẫu tiếng Việt ở cả hai chế độ trả HTTP 200 và DOCX.
- PDF 5 trang ở bản dùng thử trả HTTP 422 cùng thông báo giới hạn 4 trang.

## Tài liệu Aspose

- [Aspose.PDF trên NuGet](https://www.nuget.org/packages/Aspose.pdf)
- [Giới hạn license dùng thử](https://docs.aspose.com/pdf/net/licensing/)
- [Recognition modes](https://reference.aspose.com/pdf/net/aspose.pdf/docsaveoptions.recognitionmode/)
- [Chuyển PDF sang Word](https://docs.aspose.com/pdf/net/convert-pdf-to-word/)
