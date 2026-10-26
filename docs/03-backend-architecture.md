# Bước 3 — Khung backend và kết nối HTTP

> Bước này ghi lại giai đoạn dựng khung. Luồng chuyển đổi PDF sang Word hiện tại được giải thích ở [Bước 4](04-conversion-flow.md).

## 1. Mục tiêu

Tạo ba project backend, đặt đúng chiều phụ thuộc và chạy được API đầu tiên. Bước này giúp bạn nhìn rõ nền tảng kiến trúc trước khi đưa thư viện chuyển đổi vào.

Hai endpoint hiện đã hoạt động:

| Phương thức | Đường dẫn | Công việc |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra tiến trình API có phản hồi |
| GET | `/api/conversion-options` | Đọc giới hạn dung lượng và phần mở rộng của chức năng dự kiến |

`health` chỉ kiểm tra API đang chạy. Endpoint upload và bộ chuyển đổi Aspose được bổ sung ở Bước 4.

## 2. Nhìn vào cấu trúc

```text
FoConvert/
├── backend/
│   ├── FoConvert.sln
│   ├── FoConvert.Api/
│   │   ├── Contracts/
│   │   │   └── ConversionOptionsResponse.cs
│   │   ├── Endpoints/
│   │   │   ├── HealthEndpoints.cs
│   │   │   └── ConversionOptionsEndpoints.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── FoConvert.Application/
│   │   ├── Conversions/
│   │   │   ├── PdfConversionPolicy.cs
│   │   │   └── ConversionMode.cs
│   │   └── Interfaces/
│   │       └── IPdfToWordConverter.cs
│   └── FoConvert.Infrastructure/
│       └── README.md
├── frontend/
└── docs/
```

Api là chương trình chạy web. Hai project còn lại là class library: chúng biên dịch thành thư viện và được Api sử dụng, không chạy web server riêng.

`FoConvert.sln` nhóm ba project để IDE và CLI có thể mở, quản lý, build cùng nhau. Mỗi `.csproj` mô tả một project, target framework và các tham chiếu của riêng nó.

## 3. Các lệnh đã dùng để tạo khung

Đây là lệnh để bạn đọc và hiểu quá trình đã thực hiện; không cần chạy lại trên cấu trúc đã tạo.

Tại thư mục `backend/`:

```powershell
dotnet new sln --name FoConvert --format sln
dotnet new web --name FoConvert.Api --framework net10.0 --no-restore
dotnet new classlib --name FoConvert.Application --framework net10.0 --no-restore
dotnet new classlib --name FoConvert.Infrastructure --framework net10.0 --no-restore

dotnet sln FoConvert.sln add FoConvert.Api/FoConvert.Api.csproj FoConvert.Application/FoConvert.Application.csproj FoConvert.Infrastructure/FoConvert.Infrastructure.csproj

dotnet add FoConvert.Api/FoConvert.Api.csproj reference FoConvert.Application/FoConvert.Application.csproj FoConvert.Infrastructure/FoConvert.Infrastructure.csproj
dotnet add FoConvert.Infrastructure/FoConvert.Infrastructure.csproj reference FoConvert.Application/FoConvert.Application.csproj
```

`--no-restore` hoãn bước khôi phục dependency; `dotnet build` sau đó thực hiện restore và build. `--format sln` chọn định dạng solution `.sln` một cách tường minh.

## 4. Đọc chiều phụ thuộc

```text
Api ────────────────→ Application
Api ────────────────→ Infrastructure
Infrastructure ────→ Application
```

Đây là các tham chiếu mã nguồn lúc biên dịch, không phải các HTTP request.

- **Api** nhận request, thiết lập dependency, tạo HTTP response. Nó tham chiếu Infrastructure để sau này đăng ký implementation tại điểm khởi động.
- **Application** giữ quy tắc và hợp đồng của chức năng. Project này không tham chiếu Api hoặc Infrastructure, không biết ASP.NET Core hay Aspose.
- **Infrastructure** triển khai hợp đồng bằng SDK Aspose; chi tiết adapter ở Bước 4.

Chưa tách Domain vì chức năng hiện tại chưa có mô hình nghiệp vụ cần một project riêng. Đây là cách áp dụng nguyên tắc Clean Architecture ở mức gọn, chưa phải bộ khung đầy đủ cho mọi loại ứng dụng.

## 5. Xem quy tắc trong Application

Mở `PdfConversionPolicy.cs`.

Class này giữ giới hạn dung lượng, phần mở rộng đầu vào và đầu ra. Constructor từ chối giới hạn ngoài khoảng 1–100 MB, để cấu hình sai được phát hiện ngay khi khởi động. `MaxFileSizeBytes` chuyển giới hạn thành byte, dùng cho bước kiểm tra upload về sau.

Giới hạn hiện tại là 20 × 1024 × 1024 byte, tức 20 MiB; nhãn giao diện đang viết gọn là 20 MB.

Quy tắc chỉ dùng kiểu .NET thông thường. Không có `HttpContext`, `IFormFile` hoặc kiểu dữ liệu Aspose trong Application.

## 6. Hiểu dependency injection tại Program.cs

```csharp
var maxFileSizeMb = builder.Configuration.GetValue("Conversion:MaxFileSizeMb", 20);
builder.Services.AddSingleton(new PdfConversionPolicy(maxFileSizeMb));
```

Dòng đầu đọc cấu hình tại `appsettings.json`; số 20 là giá trị mặc định nếu không có cấu hình đó. Dòng sau đăng ký một đối tượng policy vào DI container của ASP.NET Core.

`Singleton` nghĩa là các request dùng cùng một đối tượng. Policy ở đây chỉ có dữ liệu chỉ đọc, nên có thể chia sẻ. Không suy ra rằng mọi service nên dùng Singleton: khi có state thay đổi hoặc dependency khác, phải chọn lifetime phù hợp.

Trong endpoint, framework cung cấp policy đã đăng ký:

```csharp
endpoints.MapGet("/api/conversion-options", (PdfConversionPolicy policy) =>
    Results.Ok(new ConversionOptionsResponse(
        policy.MaxFileSizeMb,
        PdfConversionPolicy.InputExtension,
        PdfConversionPolicy.OutputExtension)));
```

Endpoint không tự tạo policy bằng `new` mỗi lần được gọi. `Program.cs` là nơi lắp các thành phần với nhau, thường gọi là composition root.

## 7. Hiểu endpoint và response

`MapGet` đăng ký đường dẫn cho phương thức HTTP GET. `Results.Ok` tạo response HTTP 200 và ASP.NET Core serialize đối tượng thành JSON.

`ConversionOptionsResponse` là DTO dành cho HTTP response, nên được đặt ở Api. C# dùng tên `MaxFileSizeMb`; cấu hình JSON mặc định của ASP.NET Core xuất thành `maxFileSizeMb`.

Response:

```json
{
  "maxFileSizeMb": 20,
  "inputExtension": ".pdf",
  "outputExtension": ".docx"
}
```

Frontend hiện tải giới hạn và thông tin engine từ endpoint này.

## 8. Hiểu hợp đồng chuyển đổi

`IPdfToWordConverter` nằm trong Application và mô tả việc cần thực hiện:

```csharp
Task<byte[]> ConvertAsync(
    Stream source,
    ConversionMode mode,
    CancellationToken cancellationToken = default);
```

- `Stream source`: luồng dữ liệu PDF, không gắn với riêng HTTP upload.
- `ConversionMode`: chọn ưu tiên chỉnh sửa hoặc bố cục.
- `Task<byte[]>`: kết quả bất đồng bộ chứa dữ liệu DOCX.
- `CancellationToken`: truyền yêu cầu hủy xuống implementation; mức hỗ trợ thực tế phụ thuộc SDK.

Adapter Aspose trong Infrastructure hiện triển khai interface này và được Api đăng ký qua DI. Application định nghĩa hợp đồng, còn hạ tầng cung cấp cách thực thi.

## 9. Xem Vite proxy

Trong `frontend/vite.config.ts`:

```ts
server: {
  port: 5173,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5080',
      changeOrigin: true,
    },
  },
}
```

Khi một request đến Vite có đường dẫn bắt đầu bằng `/api`, Vite chuyển request đó sang backend. Giữ cổng 5173 cố định giúp tránh frontend tự chạy sang cổng khác trong lúc học.

```text
Trình duyệt → localhost:5173/api/health
            → Vite proxy
            → 127.0.0.1:5080/api/health
            → response JSON về trình duyệt
```

Về sau React có thể gọi `fetch('/api/...')` trong môi trường phát triển này. Vite proxy không được đóng gói vào bản frontend build; khi triển khai phải cấu hình đường đi tới API phù hợp.

## 10. Tự chạy và quan sát

Terminal thứ nhất, tại thư mục FoConvert:

```powershell
dotnet run --project backend/FoConvert.Api --launch-profile http
```

Terminal thứ hai:

```powershell
cd frontend
npm run dev
```

Mở `http://localhost:5173/api/health`, bạn cần thấy:

```json
{
  "status": "ok",
  "service": "FoConvert.Api"
}
```

Sau đó mở `http://localhost:5173/api/conversion-options` và đối chiếu với DTO trong code.

Thử đổi `Conversion:MaxFileSizeMb` thành 10 trong `backend/FoConvert.Api/appsettings.json`, khởi động lại API và xem response thay đổi. Sau khi quan sát, đổi lại 20 và khởi động lại API. Frontend chưa đọc endpoint này nên nhãn giới hạn trên giao diện vẫn là giá trị trong utility frontend.

Build và các bước kiểm tra mới nhất được ghi trong [Bước 4](04-conversion-flow.md).

## Tài liệu chính thức

- https://learn.microsoft.com/dotnet/core/tools/dotnet-sln
- https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-10.0
