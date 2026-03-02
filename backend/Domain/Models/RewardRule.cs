using Newtonsoft.Json;

namespace Backend.Domain.Models;

[Table("reward_rules")]
public record RewardRule
{
    [Key, Column(name: "id")] public string Id { get; set; } = null!;

    [Column(name: "event_id"), ForeignKey(name: "event_id")]
    public string EventId { get; set; } = null!;

    [Column(name: "name")] public string Name { get; set; } = string.Empty;

    [Column(name: "tab")] public string Tab { get; set; } = string.Empty;

    [Column(name: "column")] public string Column { get; set; } = string.Empty;

    [Column(name: "queries", TypeName = "json"), JsonData]
    public ICollection<RewardRuleQuery> Queries { get; set; } = [];

    [Column(name: "enabled")] public bool Enabled { get; set; } = true;

    [Column(name: "edit_access")] public string EditAccess { get; set; } = "restricted";
}

public sealed record RewardRuleQuery
{
    [JsonPropertyName("query"), JsonProperty("query")] public string Query { get; set; } = null!;
    [JsonPropertyName("errorMessage"), JsonProperty("errorMessage")] public string ErrorMessage { get; set; } = null!;
}