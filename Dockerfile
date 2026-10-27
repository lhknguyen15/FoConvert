FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src
COPY backend/ ./backend/

RUN dotnet restore backend/FoConvert.Api/FoConvert.Api.csproj --locked-mode
RUN dotnet publish backend/FoConvert.Api/FoConvert.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

# Aspose.PDF uses GDI+ for some PDF rendering paths. Render runs Linux, so
# install the native graphics library and fonts required by the converter.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgdiplus \
        libc6-dev \
        fontconfig \
        fonts-dejavu-core \
        fonts-liberation \
    && ln -sf /usr/lib/x86_64-linux-gnu/libgdiplus.so /usr/lib/gdiplus.dll \
    && ln -sf /usr/lib/x86_64-linux-gnu/libgdiplus.so /usr/lib/libgdiplus.dll \
    && ln -sf /usr/lib/x86_64-linux-gnu/libgdiplus.so /usr/lib/x86_64-linux-gnu/gdiplus.dll \
    && ln -sf /usr/lib/x86_64-linux-gnu/libgdiplus.so /usr/lib/x86_64-linux-gnu/libgdiplus.dll \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "dotnet FoConvert.Api.dll --urls http://0.0.0.0:${PORT:-10000}"]