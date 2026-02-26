namespace Backend.RewardRules;

public sealed class RewardRuleRepository(
    ILogger<Repository<RewardRule, string, RewardRuleCreateDto, RewardRuleUpdateDto>> logger,
    IDbConnectionFactory connectionFactory)
    : Repository<RewardRule, string, RewardRuleCreateDto, RewardRuleUpdateDto>(logger, connectionFactory),
        IRewardRuleRepository
{
    public async ValueTask<Fin<ICollection<RewardRule>>> GetByEventIdAsync(string eventId, CancellationToken ct = default)
    {
        const string sql = """
                           SELECT r.id AS Id,
                                  r.event_id AS EventId,
                                  r.name AS Name,
                                  r.tab AS Tab,
                                  r.column AS `Column`,
                                  r.queries AS Queries,
                                  r.enabled AS Enabled,
                                  r.edit_access AS EditAccess,
                                  r.updated_at AS UpdatedAt
                           FROM reward_rules r
                           WHERE r.event_id = @eventId
                             AND r.enabled = TRUE
                           ORDER BY r.name;
                           """;

        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var results = await connection.QueryAsync<RewardRule>(sql, new { eventId = Guid.Parse(eventId) });
            return Fin.Succ<ICollection<RewardRule>>(results.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching reward rules, info: {@Info}", new { eventId });
            return Fin.Fail<ICollection<RewardRule>>(ex);
        }
    }

    public async ValueTask<Fin<ICollection<RewardRule>>> GetByEventTypeAsync(string eventType, string team,
        CancellationToken ct = default)
    {
        const string sql = """
                           SELECT r.id AS Id,
                                  r.event_id AS EventId,
                                  r.name AS Name,
                                  r.tab AS Tab,
                                  r.column AS `Column`,
                                  r.queries AS Queries,
                                  r.enabled AS Enabled,
                                  r.edit_access AS EditAccess,
                                  r.updated_at AS UpdatedAt
                           FROM reward_rules r
                           LEFT JOIN events e ON r.event_id = e.id
                           LEFT JOIN teams t ON e.team_id = t.id
                           WHERE t.slug = @team
                             AND e.type = @eventType
                             AND r.enabled = TRUE
                           ORDER BY r.name;
                           """;

        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var results = await connection.QueryAsync<RewardRule>(sql, new { team, eventType });
            return Fin.Succ<ICollection<RewardRule>>(results.ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching reward rules, info: {@Info}", new { team, eventType });
            return Fin.Fail<ICollection<RewardRule>>(ex);
        }
    }
}