namespace Backend.Abstractions;

public interface IMySqlSession : IAsyncDisposable
{
    MySqlConnection Connection { get; }
    MySqlTransaction? Transaction { get; }
    Task BeginTransactionAsync(CancellationToken ct = default);
    Task CommitAsync(CancellationToken ct = default);
    Task RollbackAsync(CancellationToken ct = default);
}