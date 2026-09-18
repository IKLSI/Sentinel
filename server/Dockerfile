FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props Directory.Packages.props ./
COPY src/API/Sentinel.API.csproj src/API/
COPY src/Application/Sentinel.Application.csproj src/Application/
COPY src/Domain/Sentinel.Domain.csproj src/Domain/
COPY src/Infrastructure/Sentinel.Infrastructure.csproj src/Infrastructure/
RUN dotnet restore src/API/Sentinel.API.csproj

COPY src/ src/
RUN dotnet publish src/API/Sentinel.API.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} exec dotnet Sentinel.API.dll"]
