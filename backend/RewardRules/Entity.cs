namespace Backend.RewardRules;

public sealed record RewardRuleQuery(string Query, string ErrorMessage, string? Description = null);

[Table("reward_rules")]
public record RewardRule : IRule
{
    [Column(name: "id")] public string Id { get; set; } = Guid.CreateVersion7().ToString();

    [Column(name: "event_id")]
    [ForeignKey(name: "event_id")]
    public string EventId { get; set; } = string.Empty;

    [Column(name: "name")] public string Name { get; set; } = string.Empty;

    [Column(name: "tab")] public string Tab { get; set; } = string.Empty;

    [Column(name: "column")] public string Column { get; set; } = string.Empty;

    [Column(name: "queries", TypeName = "json")]
    public ICollection<RewardRuleQuery> Queries { get; set; } = [];

    [NotMapped] public string ErrorMessage { get => Queries.FirstOrDefault()?.ErrorMessage ?? ""; set { } }

    [Column(name: "enabled")] public bool Enabled { get; set; } = true;

    [Column(name: "edit_access")] public string EditAccess { get; set; } = "restricted";

    [Column(name: "updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column(name: "created_at")] public DateTimeOffset CreateAt { get; set; } = DateTime.UtcNow;
}

