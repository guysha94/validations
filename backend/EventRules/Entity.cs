namespace Backend.EventRules;

[Table("event_rules")]
public record EventRule : IRule
{
    [Column(name: "id")] public string Id { get; set; } = Guid.CreateVersion7().ToString();

    [Column(name: "event_id")]
    [ForeignKey(name: "event_id")]
    public string EventId { get; set; } = string.Empty;

    [Column(name: "name")] public string Name { get; set; } = string.Empty;

    [Column(name: "description")] public string? Description { get; set; }

    [Column(name: "error_message")] public string ErrorMessage { get; set; } = string.Empty;

    [Column(name: "query")] public string Query { get; set; } = string.Empty;

    [Column(name: "enabled")] public bool Enabled { get; set; } = true;

    [Column(name: "edit_access")] public string EditAccess { get; set; } = "restricted";

    [Column(name: "updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column(name: "created_at")] public DateTimeOffset CreateAt { get; set; } = DateTime.UtcNow;
}