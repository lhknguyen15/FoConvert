namespace FoConvert.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/health", () => Results.Ok(new
        {
            Status = "ok",
            Service = "FoConvert.Api"
        }))
        .WithName("GetHealth")
        .WithTags("System")
        .WithSummary("Kiểm tra API")
        .WithDescription("Trả về trạng thái hoạt động của FoConvert API.");

        return endpoints;
    }
}
