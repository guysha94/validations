namespace Backend.Events;

public sealed class EventRepository(
    ILogger<Repository<Event, Guid, EventCreateDto, EventUpdateDto>> logger,
    IDbConnectionFactory connectionFactory)
    : Repository<Event, Guid, EventCreateDto, EventUpdateDto>(logger, connectionFactory), IEventRepository
{
    public async ValueTask<Event> GetByEventTypeAsync(Guid eventType, CancellationToken ct = default)
    {
        const string sql = "SELECT * FROM events WHERE type = @eventType;";


        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        var result =
            await connection.QueryFirstOrDefaultAsync<Event>(sql, new { eventType });

        return result ?? throw new KeyNotFoundException($"Event with EventType '{eventType}' not found.");
    }

    public async ValueTask<Event?> UpdateSchemaAsync(Guid id, IDictionary<string, ICollection<EventColumn>> schema,
        CancellationToken ct = default)
    {
        const string sql = """
                           UPDATE events
                           SET schema = @schema,
                               updated_at = @updatedAt
                           WHERE id = @id
                           RETURNING id, type, label, icon, schema, updated_at;
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