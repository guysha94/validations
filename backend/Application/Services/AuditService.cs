using System.Text.Json;

namespace Backend.Audit;

public sealed class AuditService(IDbConnectionFactory connectionFactory, ILogger<AuditService> logger) : IAuditService
{
    private const int MaxPayloadSize = 16 * 1024; // 16KB

    public async Task LogAsync(
        string action,
        string entityType,
        string? entityId,
        string? actorId,
        string actorType,
        string source,
        object? payload,
        object? metadata,
        CancellationToken ct = default)
    {
        try
        {
            var payloadJson = payload is null ? null : TruncateJson(JsonSerializer.Serialize(payload), MaxPayloadSize);
            var metadataJson = metadata is null ? null : TruncateJson(JsonSerializer.Serialize(metadata), MaxPayloadSize);

            const string sql = """
                               INSERT INTO audit_logs (action, entity_type, entity_id, actor_id, actor_type, source, payload, metadata)
                               VALUES (@action, @entityType, @entityId, @actorId, @actorType, @source, @payload, @metadata);
                               """;

            await using var conn = await connectionFactory.CreateOpenConnectionAsync(ct);
            await conn.ExecuteAsync(new CommandDefinition(sql, new
            {
                action,
                entityType,
                entityId,
                actorId,
                actorType,
                source,
                payload = payloadJson,
                metadata = metadataJson
            }, cancellationToken: ct));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to write audit log: action={Action} entityType={EntityType} entityId={EntityId}",
                action, entityType, entityId);
            // Do not rethrow - audit failure must not fail the main operation
        }
    }

    private static string? TruncateJson(string json, int maxLength)
    {
        if (string.IsNullOrEmpty(json)) return null;
        return json.Length <= maxLength ? json : json[..maxLength] + "\"...[truncated]";
    }
}
