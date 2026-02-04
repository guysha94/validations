namespace Backend.Infra;

public sealed class MySqlConnectionFactory(IConfiguration config) : IDbConnectionFactory
{
    public const string CONNECTION_NAME = "mysql";
    private readonly string _connectionString = config.GetConnectionString(CONNECTION_NAME)
                                                ?? throw new InvalidOperationException($"Missing connection string: {CONNECTION_NAME}");

    public async ValueTask<MySqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
    {
        var conn = new MySqlConnection(_connectionString);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        return conn;
    }
}