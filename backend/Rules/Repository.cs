namespace Backend.Rules;

public sealed class RuleRepository(
    ILogger<Repository<Rule, string, RuleCreateDto, RuleUpdateDto>> logger,
    IDbConnectionFactory connectionFactory)
    : Repository<Rule, string, RuleCreateDto, RuleUpdateDto>(logger, connectionFactory), IRuleRepository
{
    public async ValueTask<ICollection<Rule>> GetByEventTypeAsync(string eventType, CancellationToken ct = default)
    {
        const string sql = "SELECT * FROM rules WHERE event_id IN (SELECT id FROM events WHERE type = @eventType)";
        var parameters = new { eventType };
        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var results = await connection.QueryAsync<Rule>(sql, parameters);
            return results.ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving rules for EventType {EventType}", eventType);
            return [];
        }
    }
}