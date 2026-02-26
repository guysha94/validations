namespace Backend.Events;

public sealed class EventRepository(
    ILogger<Repository<Event, string, EventCreateDto, EventUpdateDto>> logger,
    IDbConnectionFactory connectionFactory)
    : Repository<Event, string, EventCreateDto, EventUpdateDto>(logger, connectionFactory), IEventRepository
{
    public async ValueTask<Event?> GetByEventTypeAsync(string eventType, CancellationToken ct = default)
    {
        const string sql =
            "SELECT id as Id, type as Type, label as Label, icon as Icon, event_schema as `Schema`, updated_at as UpdatedAt FROM events WHERE type = @eventType;";


        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        var result =
            await connection.QueryFirstOrDefaultAsync<Event>(sql, new { eventType });

        return result ?? throw new KeyNotFoundException($"Event with EventType '{eventType}' not found.");
    }

    public async ValueTask<Event?> UpdateSchemaAsync(Guid id, IDictionary<string, ICollection<string>> schema,
        CancellationToken ct = default)
    {
        const string sql = """
                           UPDATE events
                           SET schema = @schema,
                               updated_at = @updatedAt
                           WHERE id = @id;
                            SELECT id as Id, type as Type, label as Label, icon as Icon, event_schema as `Schema`, updated_at as UpdatedAt;
                           """;

        var parameters = new
        {
            id,
            schema,
            updatedAt = DateTime.UtcNow
        };
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QuerySingleOrDefaultAsync<Event>(
            new CommandDefinition(sql, parameters, cancellationToken: ct)
        );
    }
}