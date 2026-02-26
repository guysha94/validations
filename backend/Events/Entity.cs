namespace Backend.Events;

[Table("events")]
public record Event
{
    [Key, Column(name: "id")] public string Id { get; set; } = Guid.CreateVersion7().ToString();

    [Column(name: "type")] public string Type { get; set; } = default!;

    [Column(name: "label")] public string Label { get; set; } = string.Empty;

    [Column(name: "icon")] public string Icon { get; set; } = string.Empty;

    [Column(name: "event_schema", TypeName = "json")]
    public IDictionary<string, ICollection<string>> Schema { get; set; } =
        new Dictionary<string, ICollection<string>>();

    [Column(name: "updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column(name: "created_at")] public DateTimeOffset CreateAt { get; set; } = DateTime.UtcNow;
}