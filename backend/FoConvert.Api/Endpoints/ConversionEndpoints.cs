using FoConvert.Application.Conversions;
using FoConvert.Api.Contracts;

namespace FoConvert.Api.Endpoints;

public static class ConversionEndpoints
{
    public static IEndpointRouteBuilder MapConversionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/convert/pdf-to-word", async (
            HttpContext context,
            ConvertPdfToWordService service) =>
        {
            if (!context.Request.HasFormContentType)
                throw new ConversionException("invalid_request", "Hãy gửi file bằng multipart/form-data.");

            // Read the form explicitly; HTTP-specific upload types stay in Api.
            var form = await context.Request.ReadFormAsync(context.RequestAborted);
            if (form.Files.Count != 1 || form.Files.GetFile("file") is not { } file)
                throw new ConversionException("missing_file", "Vui lòng gửi đúng một file PDF trong trường file.");

            var mode = form["mode"].ToString() switch
            {
                "" or "editable" => ConversionMode.Editable,
                "layout" => ConversionMode.PreserveLayout,
                _ => throw new ConversionException("invalid_mode", "Chế độ chuyển đổi không hợp lệ.")
            };

            await using var source = file.OpenReadStream();
            var result = await service.ExecuteAsync(
                source, file.FileName, file.Length, mode, context.RequestAborted);

            return Results.File(
                result.Content,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                result.FileName);
        })
        .WithName("ConvertPdfToWord")
        .WithTags("Conversion")
        .WithSummary("Chuyển PDF sang Word")
        .WithDescription("Gửi đúng một PDF trong multipart/form-data với field file. Field mode nhận editable hoặc layout.")
        .Accepts<PdfToWordUploadRequest>("multipart/form-data")
        .Produces(StatusCodes.Status200OK, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status413RequestEntityTooLarge)
        .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return endpoints;
    }
}
