namespace Backend.RewardRules;

public sealed record RewardRuleCreateDto(
    string EventId,
    string Name,
    string Tab,
    string Column,
    ICollection<RewardRuleQuery> Queries,
    bool? Enabled = true,
    string EditAccess = "restricted"
);

public sealed record RewardRuleUpdateDto(
    string? Name,
    string? Tab,
    string? Column,
    ICollection<RewardRuleQuery>? Queries,
    bool? Enabled,
    string? EditAccess
);
