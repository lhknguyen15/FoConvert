namespace FoConvert.Api.Contracts;

// Describes the multipart form in OpenAPI. The endpoint still reads the form
// explicitly so it can enforce the exactly-one-file rule.
public sealed class PdfToWordUploadRequest
{
    public IFormFile File { get; init; } = default!;
    public string Mode { get; init; } = "editable";
}
