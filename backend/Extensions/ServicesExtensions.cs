using Backend.Domain.Configs;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;

namespace Backend.Extensions;

public static class ServicesExtensions
{
    public static IServiceCollection AddGoogleSheetsService(this IServiceCollection services, IConfiguration config)
    {
        services.AddOptions<GoogleSheetsOptions>()
            .Bind(config.GetSection(GoogleSheetsOptions.SectionName));

        services.AddScoped(sp =>
        {
            var options = sp.GetRequiredService<IOptions<GoogleSheetsOptions>>().Value;
            var credentials = string.IsNullOrWhiteSpace(options.CredentialsPath)
                ? GoogleCredential.GetApplicationDefault()
                : CredentialFactory
                    .FromFile<ServiceAccountCredential>(options.CredentialsPath)
                    .ToGoogleCredential();
            return new SheetsService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credentials.CreateScoped(SheetsService.Scope.SpreadsheetsReadonly)
            });
        });
        return services;
    }
}