# FoConvert

FoConvert là ứng dụng web chuyển đổi **PDF sang Word (DOCX)**. Dự án được xây dựng để học và thực hành cách kết hợp React, ASP.NET Core, Clean Architecture và một thư viện xử lý tài liệu trong cùng một sản phẩm nhỏ.

## Công nghệ

- **Frontend:** Vite, React, TypeScript, Tailwind CSS.
- **Backend:** ASP.NET Core .NET 10 Minimal API.
- **Conversion engine:** Aspose.PDF.Drawing, được bao bọc qua adapter riêng của FoConvert.
- **Deployment:** Docker; có thể triển khai backend trên Render và frontend trên Vercel.
- **Database:** Chưa cần database. Phiên bản hiện tại xử lý file theo từng request và không lưu lịch sử chuyển đổi.

## Tính năng hiện tại

- Chọn hoặc kéo thả một file PDF.
- Kiểm tra phần mở rộng, file rỗng, chữ ký PDF và giới hạn dung lượng 20 MiB.
- Hai chế độ chuyển đổi:
  - `editable`: ưu tiên nội dung dễ chỉnh sửa trong Word.
  - `layout`: ưu tiên giữ vị trí và bố cục giống PDF.
- Tải file DOCX ngay sau khi chuyển đổi.
- Hiển thị lỗi từ API cho người dùng.
- Trang thông báo cho các chức năng đang phát triển.
- API health check, API đọc cấu hình chuyển đổi và Swagger trong môi trường Development.

> Chuyển PDF sang Word không thể bảo đảm bố cục hoàn hảo với mọi tài liệu. PDF scan chỉ chứa hình ảnh hiện chưa được OCR tự động.

## Cấu trúc dự án

```text
FoConvert/
├── backend/
│   ├── FoConvert.sln
│   ├── FoConvert.Api/             # HTTP endpoints, DI, Swagger, cấu hình
│   ├── FoConvert.Application/     # use case, policy và interface
│   └── FoConvert.Infrastructure/  # adapter Aspose.PDF.Drawing
├── frontend/
│   ├── src/components/             # thành phần giao diện
│   ├── src/pages/                  # các page, ví dụ ComingSoonPage
│   ├── src/services/               # gọi API
│   └── src/types/                  # kiểu dữ liệu dùng chung ở frontend
├── docs/                           # tài liệu học và xử lý sự cố
├── Dockerfile
└── README.md
```

Backend áp dụng Clean Architecture ở mức gọn:

```text
Api ────────────────→ Application
 │                     ↑
 └──────────────→ Infrastructure
```

`Application` chỉ biết hợp đồng `IPdfToWordConverter`. `Infrastructure` triển khai hợp đồng bằng Aspose thông qua Adapter pattern. `Api` là composition root, nơi đăng ký dependency và ánh xạ request HTTP.

## Yêu cầu môi trường

- .NET SDK 10.
- Node.js phù hợp với Vite và npm.
- Docker Desktop nếu muốn chạy bằng container.
- Git nếu muốn quản lý phiên bản.

## Chạy local

Từ thư mục gốc của repository, mở terminal thứ nhất và chạy backend:

```powershell
dotnet run --project backend/FoConvert.Api --launch-profile http
```

Mở terminal thứ hai để chạy frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Các địa chỉ local:

| Thành phần | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API health | `http://127.0.0.1:5080/api/health` |
| API options | `http://127.0.0.1:5080/api/conversion-options` |
| Swagger (Development) | `http://127.0.0.1:5080/swagger` |

Khi chạy Vite, các request bắt đầu bằng `/api` được proxy từ cổng 5173 sang backend cổng 5080. Vì vậy frontend gọi `/api/...` thay vì hard-code địa chỉ backend local.

## Build và kiểm tra

Build backend từ thư mục gốc:

```powershell
dotnet build backend/FoConvert.sln
```

Build và kiểm tra frontend:

```powershell
cd frontend
npm run lint
npm run build
```

## API chính

### Kiểm tra trạng thái

```http
GET /api/health
```

### Đọc cấu hình chuyển đổi

```http
GET /api/conversion-options
```

### Chuyển PDF sang Word

```http
POST /api/convert/pdf-to-word
Content-Type: multipart/form-data
```

Form field:

- `file`: đúng một file PDF.
- `mode`: `editable` hoặc `layout`.

Ví dụ với PowerShell:

```powershell
curl.exe -F "file=@C:\path\sample.pdf" `
  -F "mode=editable" `
  http://127.0.0.1:5080/api/convert/pdf-to-word `
  -o sample.docx
```

## Cấu hình backend

Các giá trị mặc định nằm trong `backend/FoConvert.Api/appsettings.json`:

```json
{
  "Conversion": {
    "MaxFileSizeMb": 20,
    "MaxPages": 50,
    "LicensePath": ""
  }
}
```

Nếu có license Aspose, có thể cấu hình bằng biến môi trường .NET:

```text
Conversion__LicensePath=/app/license/Aspose.PDF.NET.lic
```

Không commit file license hoặc các file `.env` chứa thông tin riêng tư. `frontend/.env.example` có sẵn biến `VITE_API_BASE_URL` để cấu hình địa chỉ backend khi deploy.

## Chạy bằng Docker

Dockerfile ở thư mục gốc đã cài các thư viện Linux cần thiết cho GDI+ và font của bộ chuyển đổi.

```powershell
docker build -t fo-convert-api .
docker run --rm -p 10000:10000 -e PORT=10000 fo-convert-api
```

API sau đó có thể truy cập tại `http://localhost:10000/api/health`.

## Deploy tham khảo

### Backend trên Render

Tạo Web Service từ repository GitHub và chọn Docker:

- **Dockerfile Path:** `./Dockerfile`
- **Docker Build Context Directory:** `.`
- **Auto-Deploy:** tùy nhu cầu, thường chọn `On Commit`.
- **Health Check Path:** `/api/health`

Container đọc biến `PORT` do Render cung cấp. Không cần chạy Docker Desktop trên máy cá nhân sau khi Render đã build và chạy container.

### Frontend trên Vercel

Đặt Root Directory là `frontend`. Nếu backend đã deploy, thêm Environment Variable:

```text
VITE_API_BASE_URL=https://<ten-service-backend>.onrender.com
```

Sau khi thay đổi biến môi trường, cần redeploy frontend. Trong local, để giá trị này trống để Vite proxy sử dụng `/api`.

## Tài liệu trong repository

- [Upload file ở frontend](docs/02-file-upload.md)
- [Kiến trúc backend và Vite proxy](docs/03-backend-architecture.md)
- [Luồng chuyển đổi PDF sang Word và Swagger](docs/04-conversion-flow.md)
- [Xử lý lỗi GDI+ khi deploy Render](docs/05-render-gdiplus-troubleshooting.md)

## Giới hạn và hướng phát triển

- Chưa có đăng nhập, phân quyền hoặc lịch sử chuyển đổi.
- Chưa có database và object storage.
- OCR cho PDF scan chưa được bật.
- Có thể mở rộng thêm Word sang PDF, hàng đợi xử lý, lưu lịch sử và xác thực người dùng.

## License

Mã nguồn FoConvert phục vụ mục đích học tập và phát triển cá nhân. Thư viện Aspose.PDF có điều khoản license riêng; hãy kiểm tra license của Aspose trước khi sử dụng trong sản phẩm thương mại.
