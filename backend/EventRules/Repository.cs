namespace Backend.EventRules;

public sealed class EventRuleRepository(
    ILogger<Repository<EventRule, string, EventRuleCreateDto, EventRuleUpdateDto>> logger,
    IDbConnectionFactory connectionFactory)
    : Repository<EventRule, string, EventRuleCreateDto, EventRuleUpdateDto>(logger, connectionFactory), IEventRuleRepository
{
    public async ValueTask<Fin<ICollection<EventRule>>> GetByEventTypeAsync(string eventType, string team,
        CancellationToken ct = default)
    {
        const string sql = """
                           SELECT r.id AS Id,
                                  r.event_id AS EventId,
                                  r.name AS Name,
                                  r.description AS Description,
                                  r.error_message AS ErrorMessage,
                                  r.query AS Query,
                                  r.enabled AS Enabled,
                                  r.edit_access AS EditAccess,
                                  r.updated_at AS UpdatedAt
                           FROM event_rules r
                           LEFT JOIN events e ON r.event_id = e.id
                           LEFT JOIN teams t ON e.team_id = t.id
                           WHERE t.slug = @team
                               AND e.type = @eventType
                               AND r.enabled = TRUE;
                           """;

        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var results = await connection.QueryAsync<EventRule>(sql, new { team, eventType });
            return Fin.Succ<ICollection<EventRule>>(results.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching event rules, info: {@Info}", new { team, eventType });
            return Fin.Fail<ICollection<EventRule>>(ex);
        }
    }
}