# Base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
# Build image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj file
COPY ["API_VanHungThinh.csproj", "."]
RUN dotnet restore "API_VanHungThinh.csproj"

# Copy everything else
COPY . ./
RUN dotnet publish "API_VanHungThinh.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "API_VanHungThinh.dll"]
