namespace Backend.Infra;

public sealed class MySqlConnectionFactory(IConfiguration config) : IDbConnectionFactory
{
    public const string VALIDATIONS_CONNECTION_NAME = "validations";


    public async ValueTask<MySqlConnection> CreateOpenConnectionAsync(
        string connectionName,
        CancellationToken ct = default)
    {
        var connectionString = config.GetConnectionString(connectionName)
                               ?? throw new InvalidOperationException(
                                   $"Missing connection string: {connectionName}");
        var conn = new MySqlConnection(connectionString);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        return conn;
    }

    public ValueTask<MySqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
        => CreateOpenConnectionAsync(VALIDATIONS_CONNECTION_NAME, ct);
}