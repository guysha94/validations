namespace Backend.Events;

public sealed record EventCreateDto(
    string Type,
    string? Label,
    IDictionary<string, ICollection<string>>? Schema,
    string? Icon
);

public sealed record EventUpdateDto(
    string? Type = null,
    string? Label = null,
    IDictionary<string, ICollection<string>>? Schema = null,
    string? Icon = null
);