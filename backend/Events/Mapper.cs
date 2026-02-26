namespace Backend.Events;

public static class Mapper
{
    public static Event ToEvent(this EventCreateDto dto) =>
        new()
        {
            Type = dto.Type,
            Label = dto.Label ?? string.Empty,
            Icon = dto.Icon ?? string.Empty,
        };

    public static Event ToEvent(this EventUpdateDto dto, string id) =>
        new()
        {
            Id = id,
            Type = dto.Type ?? string.Empty,
            Label = dto.Label ?? string.Empty,
            Icon = dto.Icon ?? string.Empty,
            UpdatedAt = DateTime.UtcNow
        };
}