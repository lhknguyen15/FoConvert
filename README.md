# FoConvert

Ứng dụng học theo từng bước: **Vite + React + TypeScript + Tailwind CSS** cho frontend, **ASP.NET Core .NET 10** cho backend theo hướng Clean Architecture gọn. Chưa cần database.

## Trạng thái hiện tại

- Frontend chọn một PDF, nhận kéo thả, hiển thị tên/dung lượng, bỏ chọn và kiểm tra đuôi file, file trống, giới hạn 20 MiB.
- Backend có ba project Api, Application và Infrastructure, cùng API health và API đọc quy tắc upload.
- Đã khai báo hợp đồng `IPdfToWordConverter` ở Application; implementation và SDK chuyển đổi sẽ được thêm trong chặng tiếp theo.
- Chưa có endpoint nhận file và chưa chuyển PDF thành Word trong dự án FoConvert này.

## Chạy dự án

Cần .NET SDK 10 và phiên bản Node đáp ứng Vite đã cài trong frontend. Nếu là bản sao mới, chạy `npm ci` tại `frontend/` trước.

Mở terminal tại thư mục FoConvert, chạy backend:

```powershell
dotnet run --project backend/FoConvert.Api --launch-profile http
```

Giữ terminal này mở. Trong terminal thứ hai:

```powershell
cd frontend
npm run dev
```

- Frontend: `http://localhost:5173/`
- API health: `http://127.0.0.1:5080/api/health`
- Health qua Vite proxy: `http://localhost:5173/api/health`
- Quy tắc chuyển đổi: `http://localhost:5173/api/conversion-options`

Vite proxy được dùng khi chạy `npm run dev`. Khi triển khai bản build frontend, cần cấu hình reverse proxy hoặc địa chỉ API tương ứng.

Nhấn Ctrl+C trong từng terminal để dừng dịch vụ tương ứng.

## Build

```powershell
dotnet build backend/FoConvert.sln
```

Trong `frontend/`:

```powershell
npm run build
```

## Hướng dẫn học

- `docs/02-file-upload.md`: component, props, state và đối tượng File.
- `docs/03-backend-architecture.md`: cấu trúc backend, tham chiếu project, dependency injection, endpoint và Vite proxy.
