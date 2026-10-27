FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src
COPY backend/ ./backend/

RUN dotnet restore backend/FoConvert.Api/FoConvert.Api.csproj --locked-mode
RUN dotnet publish backend/FoConvert.Api/FoConvert.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "dotnet FoConvert.Api.dll --urls http://0.0.0.0:${PORT:-10000}"]