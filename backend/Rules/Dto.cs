namespace Backend.Rules;

public sealed record RuleCreateDto(
    string EventId,
    string Name,
    string ErrorMessage,
    string Query,
    bool? Enabled
);

public sealed record RuleUpdateDto(
    string? Name,
    string? ErrorMessage,
    string? Query,
    bool? Enabled
);

public sealed record RuleUpdateManyDto(
    string Id,
    RuleUpdateDto Changes
);