namespace Backend.Events;

public sealed record EventCreateDto(
    string Type,
    string? Label,
    IDictionary<string, ICollection<EventColumn>>? Schema,
    string? Icon
);

public sealed record EventUpdateDto(
    string? Type = null,
    string? Label = null,
    IDictionary<string, ICollection<EventColumn>>? Schema = null,
    string? Icon = null
);