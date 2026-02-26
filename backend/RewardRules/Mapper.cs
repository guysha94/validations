namespace Backend.RewardRules;

public static class Mapper
{
    public static RewardRule ToRewardRule(this RewardRuleCreateDto dto) =>
        new()
        {
            EventId = dto.EventId,
            Name = dto.Name,
            Tab = dto.Tab,
            Column = dto.Column,
            Queries = dto.Queries ?? [],
            Enabled = dto.Enabled ?? true,
            EditAccess = dto.EditAccess,
        };
}
