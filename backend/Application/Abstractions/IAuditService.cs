namespace Backend.Application.Abstractions;

public interface IAuditService
{
    Task LogAsync(Audit log, CancellationToken ct = default);
}
