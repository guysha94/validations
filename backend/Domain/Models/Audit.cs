

namespace Backend.Domain.Models;

[Table("audit_logs")]
public record Audit
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None), Column(name: "id")] public string Id { get; set; } = Guid.CreateVersion7().ToString();
    [Column(name: "action")] public string Action { get; set; } = string.Empty;
    [Column(name: "entity_type")] public string EntityType { get; set; } = string.Empty;
    [Column(name: "entity_id")] public string EntityId { get; set; } = string.Empty;
    [Column(name: "actor_id")] public string ActorId { get; set; } = string.Empty;
    [Column(name: "actor_type")] public string ActorType { get; set; } = string.Empty;
    [Column(name: "source")] public string Source { get; set; } = string.Empty;

    [Column(name: "payload", TypeName = "json"), JsonData]
    public IDictionary<string, object> Payload { get; set; } = new Dictionary<string, object>();

    [Column(name: "metadata", TypeName = "json"), JsonData]
    public IDictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();

    [Column(name: "team_slug")] public string TeamSlug { get; set; } = string.Empty;
}