namespace FoConvert.Application.Conversions;

// Application describes the failure; Api decides which HTTP status to return.
public sealed class ConversionException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
