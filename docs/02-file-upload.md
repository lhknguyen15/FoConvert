# Bước 2 — Chọn PDF, props và state

## 1. Kết quả của bước này

Bạn có thể chọn một PDF từ máy tính hoặc kéo thả vào vùng chọn, xem tên và dung lượng, rồi bỏ file để chọn lại. File vẫn ở trong trình duyệt; chưa có HTTP request gửi tài liệu lên backend.

Giao diện dùng Tailwind. `frontend/src/index.css` vẫn chỉ cần `@import "tailwindcss";`.

## 2. Đọc các file theo thứ tự

| File trong `frontend/src/` | Trách nhiệm |
| --- | --- |
| `App.tsx` | Giữ file đang chọn và lỗi; điều phối các component con |
| `components/PdfUpload.tsx` | Nhận file qua hộp thoại hoặc kéo thả, thông báo cho App |
| `components/SelectedFileCard.tsx` | Hiển thị thông tin file và nút bỏ chọn |
| `utils/pdfFile.ts` | Kiểm tra file và định dạng dung lượng để hiển thị |

## 3. Bắt đầu với state trong App

```tsx
const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [error, setError] = useState<string | null>(null)
```

`useState` lưu dữ liệu qua các lần React render. Khi gọi hàm cập nhật như `setSelectedFile`, React lên lịch render lại component để hiển thị dữ liệu mới.

`File | null` là union type của TypeScript: biến có thể chứa một đối tượng `File` hoặc `null`. Ban đầu chưa có file nên giá trị khởi tạo là `null`.

`File` là đối tượng trình duyệt cung cấp. Nó có các thuộc tính như `name`, `size`, `type`, `lastModified`, cùng khả năng đọc nội dung. Nó không chỉ là tên hoặc đường dẫn file.

App giữ `selectedFile` vì sau này cả thẻ thông tin và chức năng chuyển đổi đều cần dùng file đó. Đây là cách đưa state lên component cha chung, thường gọi là lifting state up.

## 4. Theo dõi callback từ component con lên cha

Trong App:

```tsx
<PdfUpload onFilesSelected={handleFilesSelected} />
```

Trong PdfUpload, kiểu props được khai báo:

```tsx
type PdfUploadProps = {
  onFilesSelected: (files: File[]) => void
}
```

Prop này là một hàm nhận danh sách `File`, không trả về giá trị sử dụng được (`void`). App truyền hàm xuống; PdfUpload gọi hàm đó khi người dùng chọn tài liệu. Component con không tự sửa state của App.

Luồng thực tế:

```text
Người dùng chọn file
  → PdfUpload gọi onFilesSelected(files)
  → App chạy handleFilesSelected(files)
  → Kiểm tra số file, phần mở rộng và dung lượng
  → setSelectedFile(file)
  → React render lại
  → SelectedFileCard nhận file qua props và hiển thị
```

## 5. Hiểu các chi tiết trong PdfUpload

- `useId()` tạo ID để nối input với label. Nhấp vào label sẽ mở input tương ứng.
- `accept=".pdf,application/pdf"` gợi ý bộ lọc cho hộp thoại chọn file. Đây không phải cơ chế xác minh nội dung PDF.
- `Array.from(...)` đổi `FileList` của trình duyệt thành mảng `File[]` để truyền theo kiểu props đã định nghĩa.
- `event.currentTarget.value = ''` xóa giá trị của input sau khi nhận file. Vì vậy người dùng có thể chọn lại cùng một file sau khi bỏ chọn hoặc gặp lỗi.
- `event.preventDefault()` trong thao tác kéo thả ngăn hành vi mặc định mở tài liệu của trình duyệt tại vùng thả.
- `isDragging` là state giao diện riêng của PdfUpload. App không cần biết người dùng đang rê file qua vùng chọn nên state này nằm ở component con.
- `import type` dùng cho các kiểu sự kiện TypeScript; các kiểu này được loại bỏ khi build JavaScript.

## 6. Theo dõi thao tác bỏ file

```tsx
<SelectedFileCard file={selectedFile} onRemove={handleRemoveFile} />
```

`file` là dữ liệu truyền xuống. `onRemove` là hàm truyền xuống để thẻ thông báo một sự kiện lên App. Khi nhấn nút bỏ chọn, App đặt file về `null`, khiến thẻ không còn được render.

Điều kiện hiển thị trong App:

```tsx
{selectedFile && (
  <SelectedFileCard file={selectedFile} onRemove={handleRemoveFile} />
)}
```

TypeScript thu hẹp kiểu của `selectedFile` thành `File` trong nhánh có dữ liệu, phù hợp với prop `file: File`.

## 7. Kiểm tra file tập trung trong utility

`validatePdfFile` trả về `null` khi các kiểm tra giao diện thành công, hoặc chuỗi lỗi để App hiển thị.

Các kiểm tra hiện có: đuôi `.pdf`, dung lượng lớn hơn 0 và không vượt 20 MiB (nhãn giao diện ghi 20 MB). App kiểm tra thêm mỗi lần chỉ có một file. Backend về sau vẫn phải kiểm tra độc lập, đọc được nội dung PDF và áp dụng giới hạn riêng; đổi tên một file thành `.pdf` vẫn có thể qua kiểm tra ở bước giao diện này.

`formatFileSize` chỉ chuyển số byte thành chuỗi B, KB hoặc MB. Nó không làm thay đổi file.

## 8. Bài thực hành

1. Chọn PDF, quan sát tên và dung lượng xuất hiện.
2. Bỏ chọn rồi chọn lại đúng file đó.
3. Kéo một file `.txt` vào vùng chọn và xem lỗi.
4. Đổi `MAX_PDF_SIZE_MB` trong `utils/pdfFile.ts` từ 20 thành 1. Quan sát nhãn giới hạn và thử với PDF lớn hơn 1 MiB, sau đó đổi lại 20.
5. Đọc `onFilesSelected` và `onRemove`, xác định hàm nào được khai báo ở cha và được gọi ở con.

`npm run build` đã thành công. Đã kiểm tra trong trình duyệt: chọn PDF, hiển thị tên/dung lượng, bỏ chọn, báo lỗi file `.txt`, file trống và file quá 20 MiB.

Chặng tiếp theo sẽ tạo backend .NET và thống nhất request/response trước khi thêm thao tác chuyển đổi.
