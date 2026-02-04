namespace Backend.Rules;

[Table("rules")]
public record Rule
{
    [Column(name: "id")] public Guid Id { get; set; } = Guid.CreateVersion7();

    [Column(name: "event_id")]
    [ForeignKey(name: "event_id")]
    public Guid EventId { get; set; } = Guid.Empty;

    [Column(name: "name")] public string Name { get; set; } = string.Empty;

    [Column(name: "error_message")] public string ErrorMessage { get; set; } = string.Empty;

    [Column(name: "query")] public string Query { get; set; } = string.Empty;

    [Column(name: "enabled")] public bool Enabled { get; set; } = true;

    [Column(name: "updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Ignore] [JsonInclude] public DateTimeOffset CreateAt => Id.CreationTime();
}