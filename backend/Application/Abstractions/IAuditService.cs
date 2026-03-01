namespace Backend.Audit;

public interface IAuditService
{
    Task LogAsync(
        string action,
        string entityType,
        string? entityId,
        string? actorId,
        string actorType,
        string source,
        object? payload,
        object? metadata,
        CancellationToken ct = default);
}
