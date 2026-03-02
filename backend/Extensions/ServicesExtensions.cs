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

    public static IServiceCollection AddDbMappers(this IServiceCollection services)
    {
        SqlMapper.AddTypeHandler(new JsonTypeHandler<IDictionary<string, ICollection<string>>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<IDictionary<string, object>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<LanguageExt.HashSet<string>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<List<string>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<ICollection<string>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<List<RewardRuleQuery>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<ICollection<RewardRuleQuery>>());
        DommelMapper.SetKeyPropertyResolver(new KeyPropertyResolver());
        DommelJsonMapper.AddJson(typeof(Event).Assembly);
        return services;
    }
}