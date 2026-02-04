namespace Backend.Events;

[Table("events")]
public record Event
{
    [Key, Column(name: "id")] public Guid Id { get; set; } = Guid.CreateVersion7();

    [Column(name: "type")] public string Type { get; set; } = default!;

    [Column(name: "label")] public string Label { get; set; } = string.Empty;

    [Column(name: "icon")] public string Icon { get; set; } = string.Empty;

    [Column(name: "event_schema", TypeName = "json")]
    public IDictionary<string, ICollection<EventColumn>> Schema { get; set; } =
        new Dictionary<string, ICollection<EventColumn>>();

    [Column(name: "updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Ignore] [JsonInclude] public DateTimeOffset CreateAt => Id.CreationTime();
}

public sealed record EventColumn(string Name, bool IsReward);