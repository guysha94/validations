namespace Backend.Application.Services;

public sealed class AuditService(IDbConnectionFactory connectionFactory, ILogger<AuditService> logger) : IAuditService
{
    public async Task LogAsync(Audit log, CancellationToken ct = default)
    {
        try
        {
            await using var conn = await connectionFactory.CreateOpenConnectionAsync(ct);
            await conn.InsertAsync(log, cancellationToken: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to log audit event: {@Log}", log);
        }
    }
}