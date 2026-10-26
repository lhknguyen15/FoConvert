using System.Text;
using FoConvert.Application.Interfaces;

namespace FoConvert.Application.Conversions;

public sealed class ConvertPdfToWordService(
    IPdfToWordConverter converter,
    PdfConversionPolicy policy)
{
    public async Task<ConvertedFile> ExecuteAsync(
        Stream source,
        string fileName,
        long fileLength,
        ConversionMode mode,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(mode))
            throw new ConversionException("invalid_mode", "Chế độ chuyển đổi không hợp lệ.");
        if (!string.Equals(Path.GetExtension(fileName), PdfConversionPolicy.InputExtension, StringComparison.OrdinalIgnoreCase))
            throw new ConversionException("invalid_extension", "Vui lòng chọn file có đuôi .pdf.");
        if (fileLength <= 0)
            throw new ConversionException("empty_file", "File đang trống. Vui lòng chọn PDF khác.");
        if (fileLength > policy.MaxFileSizeBytes)
            throw new ConversionException("file_too_large", $"File vượt quá {policy.MaxFileSizeMb} MB.");

        // Copy with a limit as an additional check independent of the supplied length.
        using var input = new MemoryStream();
        var buffer = new byte[81920];
        int count;
        while ((count = await source.ReadAsync(buffer, cancellationToken)) > 0)
        {
            if (input.Length + count > policy.MaxFileSizeBytes)
                throw new ConversionException("file_too_large", $"File vượt quá {policy.MaxFileSizeMb} MB.");
            await input.WriteAsync(buffer.AsMemory(0, count), cancellationToken);
        }

        if (input.Length < 5 || Encoding.ASCII.GetString(input.GetBuffer(), 0, 5) != "%PDF-")
            throw new ConversionException("invalid_pdf", "Nội dung file không phải PDF hợp lệ.");

        input.Position = 0;
        var result = await converter.ConvertAsync(input, mode, cancellationToken);

        var originalName = Path.GetFileNameWithoutExtension(fileName.Replace('\\', '/'));
        const string forbidden = "<>:\"/\\|?*";
        var safeName = new string(originalName
            .Where(c => !char.IsControl(c) && !forbidden.Contains(c))
            .Take(100).ToArray()).Trim();
        if (string.IsNullOrWhiteSpace(safeName)) safeName = "document";

        return new ConvertedFile(result, safeName + PdfConversionPolicy.OutputExtension);
    }
}
