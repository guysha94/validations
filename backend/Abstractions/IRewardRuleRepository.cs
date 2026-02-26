namespace Backend.Abstractions;

public interface IRewardRuleRepository : IRepository<RewardRule, string, RewardRuleCreateDto, RewardRuleUpdateDto>
{
    ValueTask<Fin<ICollection<RewardRule>>> GetByEventIdAsync(string eventId, CancellationToken ct = default);
    ValueTask<Fin<ICollection<RewardRule>>> GetByEventTypeAsync(string eventType, string team, CancellationToken ct = default);
}
