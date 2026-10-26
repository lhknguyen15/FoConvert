namespace FoConvert.Application.Conversions;

// This class uses ordinary .NET types and does not depend on HTTP or an SDK.
public sealed class PdfConversionPolicy
{
    public const string InputExtension = ".pdf";
    public const string OutputExtension = ".docx";

    public int MaxFileSizeMb { get; }
    public long MaxFileSizeBytes => MaxFileSizeMb * 1024L * 1024;

    public PdfConversionPolicy(int maxFileSizeMb)
    {
        if (maxFileSizeMb is < 1 or > 100)
            throw new ArgumentOutOfRangeException(nameof(maxFileSizeMb), "File size must be between 1 and 100 MB.");

        MaxFileSizeMb = maxFileSizeMb;
    }
}
