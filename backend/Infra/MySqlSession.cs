namespace Backend.Infra;

public sealed class MySqlSession(IDbConnectionFactory factory) : IMySqlSession
{
    private MySqlConnection? _conn;

    public MySqlConnection Connection =>
        _conn ?? throw new InvalidOperationException(
            "Session not initialized. Call BeginTransactionAsync or ensure connection opened.");

    public MySqlTransaction? Transaction { get; private set; }

    public async Task BeginTransactionAsync(CancellationToken ct = default)
    {
        if (_conn is not null) return;

        _conn = await factory.CreateOpenConnectionAsync(ct);
        Transaction = await _conn.BeginTransactionAsync(ct).ConfigureAwait(false);
    }

    public async Task CommitAsync(CancellationToken ct = default)
    {
        if (Transaction is null) return;
        await Transaction.CommitAsync(ct).ConfigureAwait(false);
    }

    public async Task RollbackAsync(CancellationToken ct = default)
    {
        if (Transaction is null) return;
        await Transaction.RollbackAsync(ct).ConfigureAwait(false);
    }

    public async ValueTask DisposeAsync()
    {
        if (Transaction is not null) await Transaction.DisposeAsync().ConfigureAwait(false);
        if (_conn is not null) await _conn.DisposeAsync().ConfigureAwait(false); // returns to pool
    }
}