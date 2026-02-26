FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    gcc \
    g++ \
    make \
    binutils \
    libc6-dev \
    zlib1g-dev \
 && rm -rf /var/lib/apt/lists/* 

ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["validations/validations.csproj", "validations/"]
RUN dotnet restore "validations/validations.csproj"
COPY . .
WORKDIR "/src/validations"
RUN dotnet build "./validations.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./validations.csproj" -c $BUILD_CONFIGURATION \
    -o /app/publish /p:UseAppHost=false

FROM base AS final

WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "validations.dll"]
