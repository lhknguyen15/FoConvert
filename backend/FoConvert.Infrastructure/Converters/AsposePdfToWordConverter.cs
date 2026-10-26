using Aspose.Pdf;
using Aspose.Pdf.Text;
using FoConvert.Application.Conversions;
using FoConvert.Application.Interfaces;

namespace FoConvert.Infrastructure.Converters;

// Adapter: translate FoConvert's contract into calls to the Aspose SDK.
public sealed class AsposePdfToWordConverter : IPdfToWordConverter, IDisposable
{
    private readonly SemaphoreSlim gate = new(1, 1);
    public ConversionEngineInfo Info { get; }

    public AsposePdfToWordConverter(AsposePdfOptions options)
    {
        if (options.MaxPages is < 1 or > 500)
            throw new ArgumentOutOfRangeException(nameof(options), "MaxPages must be between 1 and 500.");

        var licensed = !string.IsNullOrWhiteSpace(options.LicensePath);
        if (licensed) new License().SetLicense(options.LicensePath);

        Info = new ConversionEngineInfo(
            "Aspose.PDF",
            IsTrial: !licensed,
            MaxPages: licensed ? options.MaxPages : Math.Min(4, options.MaxPages),
            SupportsOcr: false);
    }

    public async Task<byte[]> ConvertAsync(
        Stream source,
        ConversionMode mode,
        CancellationToken cancellationToken = default)
    {
        if (!await gate.WaitAsync(0, cancellationToken))
            throw new ConversionException("busy", "Đang xử lý một tài liệu khác. Bạn vui lòng thử lại sau.");

        try
        {
            // Aspose is synchronous. Keep the gate until it really finishes,
            // even when the browser disconnects during conversion.
            return await Task.Run(() => Convert(source, mode), cancellationToken);
        }
        finally { gate.Release(); }
    }

    private byte[] Convert(Stream source, ConversionMode mode)
    {
        try
        {
            using var document = new Document(source);
            if (document.Pages.Count == 0)
                throw new ConversionException("empty_pdf", "PDF không có trang nào để chuyển đổi.");
            if (document.Pages.Count > Info.MaxPages)
                throw new ConversionException("page_limit", $"File có {document.Pages.Count} trang. Bản hiện tại hỗ trợ tối đa {Info.MaxPages} trang mỗi file.");

            var text = new TextAbsorber();
            document.Pages.Accept(text);
            if (string.IsNullOrWhiteSpace(text.Text))
                throw new ConversionException("ocr_required", "Không tìm thấy văn bản trong PDF. File scan hoặc file chỉ có ảnh cần OCR; bản này chưa hỗ trợ OCR.");

            var options = new DocSaveOptions
            {
                Format = DocSaveOptions.DocFormat.DocX,
                Mode = mode == ConversionMode.PreserveLayout
                    ? DocSaveOptions.RecognitionMode.Textbox
                    : DocSaveOptions.RecognitionMode.EnhancedFlow,
                RecognizeBullets = true
            };

            using var output = new MemoryStream();
            document.Save(output, options);
            return output.ToArray();
        }
        catch (InvalidPasswordException)
        {
            throw new ConversionException("password_required", "PDF có mật khẩu. Hãy mở khóa file trước khi chuyển đổi.");
        }
        catch (InvalidPdfFileFormatException)
        {
            throw new ConversionException("invalid_pdf", "Không đọc được PDF. File có thể bị hỏng hoặc sai định dạng.");
        }
    }

    public void Dispose() => gate.Dispose();
}
