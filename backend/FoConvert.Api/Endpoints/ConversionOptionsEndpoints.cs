using FoConvert.Api.Contracts;
using FoConvert.Application.Conversions;
using FoConvert.Application.Interfaces;

namespace FoConvert.Api.Endpoints;

public static class ConversionOptionsEndpoints
{
    public static IEndpointRouteBuilder MapConversionOptionsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // ASP.NET Core injects the policy registered in Program.cs.
        endpoints.MapGet("/api/conversion-options", (PdfConversionPolicy policy, IPdfToWordConverter converter) =>
            Results.Ok(new ConversionOptionsResponse(
                policy.MaxFileSizeMb,
                PdfConversionPolicy.InputExtension,
                PdfConversionPolicy.OutputExtension,
                converter.Info.Name,
                converter.Info.IsTrial,
                converter.Info.MaxPages,
                converter.Info.SupportsOcr)))
            .WithName("GetConversionOptions")
            .WithTags("Conversion")
            .WithSummary("Đọc cấu hình chuyển đổi")
            .WithDescription("Trả về giới hạn upload, định dạng và khả năng của conversion engine.");

        return endpoints;
    }
}
