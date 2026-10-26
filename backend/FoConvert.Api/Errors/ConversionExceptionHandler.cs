using FoConvert.Application.Conversions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace FoConvert.Api.Errors;

public sealed class ConversionExceptionHandler(ILogger<ConversionExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (context.RequestAborted.IsCancellationRequested) return true;

        var (status, code, detail) = exception switch
        {
            ConversionException error => (MapStatus(error.Code), error.Code, error.Message),
            BadHttpRequestException error => (
                error.StatusCode,
                "invalid_request",
                error.StatusCode == 413 ? "File vượt quá dung lượng cho phép." : "Yêu cầu tải lên không hợp lệ."),
            InvalidDataException => (400, "invalid_upload", "Dữ liệu tải lên không hợp lệ hoặc quá dung lượng cho phép."),
            _ => (500, "conversion_failed", "Chưa thể chuyển đổi tài liệu này. Bạn vui lòng thử file khác hoặc thử lại sau.")
        };

        if (status >= 500)
            logger.LogError(exception, "Conversion failed. Trace ID: {TraceId}", context.TraceIdentifier);

        var problem = new ProblemDetails
        {
            Status = status,
            Title = "Không thể hoàn tất yêu cầu",
            Detail = detail
        };
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = context.TraceIdentifier;
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }

    private static int MapStatus(string code) => code switch
    {
        "file_too_large" => 413,
        "busy" => 429,
        "invalid_pdf" or "empty_pdf" or "page_limit" or "password_required" or "ocr_required" => 422,
        _ => 400
    };
}
