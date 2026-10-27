using FoConvert.Api.Endpoints;
using FoConvert.Api.Errors;
using FoConvert.Application.Conversions;
using FoConvert.Application.Interfaces;
using FoConvert.Infrastructure.Converters;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Composition root: create dependencies here and inject them into endpoints.
var maxFileSizeMb = builder.Configuration.GetValue("Conversion:MaxFileSizeMb", 20);
builder.Services.AddSingleton(new PdfConversionPolicy(maxFileSizeMb));
var licensePath = builder.Configuration.GetValue<string>("Conversion:LicensePath") ?? "";
if (!string.IsNullOrWhiteSpace(licensePath))
    licensePath = Path.GetFullPath(licensePath, builder.Environment.ContentRootPath);

builder.Services.AddSingleton<IPdfToWordConverter>(_ =>
    new AsposePdfToWordConverter(new AsposePdfOptions
    {
        LicensePath = licensePath,
        MaxPages = builder.Configuration.GetValue("Conversion:MaxPages", 50)
    }));
builder.Services.AddScoped<ConvertPdfToWordService>();

var allowedCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];
if (allowedCorsOrigins.Length > 0)
{
    builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedCorsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()));
}

var maxRequestBytes = (maxFileSizeMb + 1L) * 1024 * 1024;
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = maxRequestBytes);
builder.Services.Configure<FormOptions>(options => options.MultipartBodyLengthLimit = maxRequestBytes);
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ConversionExceptionHandler>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "FoConvert API",
        Version = "v1",
        Description = "API chuyển đổi tài liệu của FoConvert."
    });
});

var app = builder.Build();
// Fail early if the configured license cannot be loaded.
_ = app.Services.GetRequiredService<IPdfToWordConverter>();

app.UseExceptionHandler();
app.UseStatusCodePages();
if (allowedCorsOrigins.Length > 0)
    app.UseCors("Frontend");
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "FoConvert API v1"));
}
app.Use(async (context, next) =>
{
    context.Response.Headers.CacheControl = "no-store";
    context.Response.Headers.XContentTypeOptions = "nosniff";
    await next(context);
});

app.MapGet("/", () => Results.Redirect("/api/health"));
app.MapHealthEndpoints();
app.MapConversionOptionsEndpoints();
app.MapConversionEndpoints();

app.Run();
