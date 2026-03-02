namespace Backend.Domain.Models;

[Table("events")]
public record Event
{
    [Key, Column(name: "id")] public string Id { get; set; } = null!;
    [Column(name: "type")] public string Type { get; set; } = null!;
    [Column(name: "team_id")] public string TeamId { get; set; } = null!;

    [Column(name: "event_schema", TypeName = "json"), JsonData]
    public IDictionary<string, ICollection<string>> Schema { get; set; } =
        new Dictionary<string, ICollection<string>>();

    [ForeignKey(nameof(EventRule.EventId))]
    public ICollection<EventRule> EventRules { get; set; } = [];

    [ForeignKey(nameof(RewardRule.EventId))]
    public ICollection<RewardRule> RewardRules { get; set; } = [];
}