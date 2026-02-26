namespace Backend.EventRules;

public sealed record EventRuleCreateDto(
    string EventId,
    string Name,
    string? Description,
    string ErrorMessage,
    string Query,
    bool? Enabled = true,
    string EditAccess = "restricted"
);

public sealed record EventRuleUpdateDto(
    string? Name,
    string? Description,
    string? ErrorMessage,
    string? Query,
    bool? Enabled,
    string? EditAccess
);

public sealed record EventRuleUpdateManyDto(
    string Id,
    EventRuleUpdateDto Changes
);