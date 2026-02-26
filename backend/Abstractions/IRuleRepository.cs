namespace Backend.Abstractions;

public interface IEventRuleRepository : IRepository<EventRule, string, EventRuleCreateDto, EventRuleUpdateDto>
{
    ValueTask<Fin<ICollection<EventRule>>> GetByEventTypeAsync(string eventType, string team, CancellationToken ct = default);
}