

namespace Backend.Abstractions;

public interface IDbConnectionFactory
{
    ValueTask<MySqlConnection> CreateOpenConnectionAsync(CancellationToken ct = default);
}