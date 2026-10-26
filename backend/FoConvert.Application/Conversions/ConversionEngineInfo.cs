namespace FoConvert.Application.Conversions;

public sealed record ConversionEngineInfo(
    string Name,
    bool IsTrial,
    int MaxPages,
    bool SupportsOcr);
