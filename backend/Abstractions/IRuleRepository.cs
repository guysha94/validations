namespace Backend.Abstractions;

public interface IRuleRepository : IRepository<Rule, string, RuleCreateDto, RuleUpdateDto>
{
    ValueTask<ICollection<Rule>> GetByEventTypeAsync(string eventType, CancellationToken ct = default);
}