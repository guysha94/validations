namespace Backend.Infra;

public sealed class MySqlConnectionFactory(IConfiguration config) : IDbConnectionFactory
{
    public const string VALIDATIONS_CONNECTION_NAME = "validations";
    public const string BACKEND_CONNECTION_NAME = "backend";

    private readonly Dictionary<string, string> _connections = new()
    {
        [VALIDATIONS_CONNECTION_NAME] = config.GetConnectionString(VALIDATIONS_CONNECTION_NAME)
                                        ?? throw new InvalidOperationException(
                                            $"Missing connection string: {VALIDATIONS_CONNECTION_NAME}"),
        [BACKEND_CONNECTION_NAME] = config.GetConnectionString(BACKEND_CONNECTION_NAME)
                                    ?? throw new InvalidOperationException(
                                        $"Missing connection string: {BACKEND_CONNECTION_NAME}")
    };

    public async ValueTask<MySqlConnection> CreateOpenConnectionAsync(
        string connectionName,
        CancellationToken ct = default)
    {
        if (!_connections.TryGetValue(connectionName, out var connection))
            throw new ArgumentException($"Unknown connection name: {connectionName}", nameof(connectionName));
        var conn = new MySqlConnection(connection);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        return conn;
    }

    public ValueTask<MySqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default)
        => CreateOpenConnectionAsync(VALIDATIONS_CONNECTION_NAME, ct);
}