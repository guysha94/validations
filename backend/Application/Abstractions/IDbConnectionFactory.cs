namespace Backend.Abstractions;

public interface IDbConnectionFactory
{
    ValueTask<MySqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default);
    
    ValueTask<MySqlConnection> CreateOpenConnectionAsync(
        string connectionName,
        CancellationToken ct = default);
}