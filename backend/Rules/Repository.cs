namespace Backend.Rules;

public sealed class RuleRepository(
    ILogger<Repository<Rule, string, RuleCreateDto, RuleUpdateDto>> logger,
    IDbConnectionFactory connectionFactory)
    : Repository<Rule, string, RuleCreateDto, RuleUpdateDto>(logger, connectionFactory), IRuleRepository
{
    public async ValueTask<ICollection<Rule>> GetByEventTypeAsync(string eventType, string team,
        CancellationToken ct = default)
    {
        const string sql = """
                           SELECT r.id AS Id,
                                  r.event_id AS EventId,
                                  r.name AS Name,
                                  r.error_message AS ErrorMessage,
                                  r.query AS Query,
                                  r.enabled AS Enabled
                           FROM rules r
                           LEFT JOIN events e ON r.event_id = e.id
                           LEFT JOIN teams t ON e.team_id = t.id
                           WHERE t.slug = @team
                               AND e.type = @eventType
                             AND r.enabled = TRUE;
                           """;

        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var results = await connection.QueryAsync<Rule>(sql, new { team, eventType });
            return results.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching rules, info: {@Info}", new { team, eventType });
            return [];
        }
    }
}