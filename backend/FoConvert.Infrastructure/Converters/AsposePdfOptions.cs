namespace FoConvert.Infrastructure.Converters;

public sealed record AsposePdfOptions
{
    public string LicensePath { get; init; } = "";
    public int MaxPages { get; init; } = 50;
}
