using FoConvert.Application.Conversions;

namespace FoConvert.Application.Interfaces;

// Application depends on this contract, not on Aspose or HTTP types.
public interface IPdfToWordConverter
{
    ConversionEngineInfo Info { get; }

    Task<byte[]> ConvertAsync(
        Stream source,
        ConversionMode mode,
        CancellationToken cancellationToken = default);
}
