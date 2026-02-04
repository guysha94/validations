using System.Reflection;
using DbUp;

namespace Backend.Extensions;

public static class DbExtensions
{
    public static IServiceCollection UpdateDbSchema(this IServiceCollection services, IConfiguration configuration)
    {
        SqlMapper.AddTypeHandler(new JsonTypeHandler<IDictionary<string, ICollection<EventColumn>>>());
        var connectionString = configuration.GetConnectionString(MySqlConnectionFactory.CONNECTION_NAME) ??
                               throw new InvalidOperationException("Connection string 'Default' not found.");

        EnsureDatabase.For.MySqlDatabase(connectionString);
        var upgrader =
            DeployChanges.To
                .MySqlDatabase(connectionString)
                .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
                .LogToConsole()
                .Build();

        if (!upgrader.IsUpgradeRequired())
            return services;

        var result = upgrader.PerformUpgrade();

        return !result.Successful
            ? throw new InvalidOperationException("Database migration failed.", result.Error)
            : services;
    }
}