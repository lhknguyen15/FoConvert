namespace FoConvert.Api.Contracts;

public sealed record ConversionOptionsResponse(
    int MaxFileSizeMb,
    string InputExtension,
    string OutputExtension,
    string Engine,
    bool IsTrial,
    int MaxPages,
    bool SupportsOcr);
