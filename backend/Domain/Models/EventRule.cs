namespace Backend.Domain.Models;

[Table("event_rules")]
public record EventRule
{
    [Key, Column(name: "id")] public string Id { get; set; } = null!;

    [Column(name: "event_id"), ForeignKey(name: "event_id")]
    public string EventId { get; set; } = null!;

    [Column(name: "name")] public string Name { get; set; } = string.Empty;

    [Column(name: "description")] public string? Description { get; set; }

    [Column(name: "error_message")] public string ErrorMessage { get; set; } = string.Empty;

    [Column(name: "query")] public string Query { get; set; } = string.Empty;

    [Column(name: "enabled")] public bool Enabled { get; set; } = true;
}