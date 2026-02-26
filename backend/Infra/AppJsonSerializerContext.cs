using Event = Backend.Events.Event;

namespace Backend.Infra;

[JsonSourceGenerationOptions(
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull)]
[JsonSerializable(typeof(Event))]
[JsonSerializable(typeof(EventRule))]
[JsonSerializable(typeof(IEnumerable<EventRule>))]
[JsonSerializable(typeof(IEnumerable<string>))]
[JsonSerializable(typeof(List<string>))]
[JsonSerializable(typeof(string[]))]
[JsonSerializable(typeof(IEnumerable<Event>))]
[JsonSerializable(typeof(EventCreateDto))]
[JsonSerializable(typeof(EventUpdateDto))]
[JsonSerializable(typeof(EventRuleCreateDto))]
[JsonSerializable(typeof(EventRuleUpdateDto))]
[JsonSerializable(typeof(EventRuleUpdateManyDto))]
[JsonSerializable(typeof(RewardRuleQuery))]
[JsonSerializable(typeof(List<RewardRuleQuery>))]
[JsonSerializable(typeof(RewardRule))]
[JsonSerializable(typeof(IEnumerable<RewardRule>))]
[JsonSerializable(typeof(RewardRuleCreateDto))]
[JsonSerializable(typeof(RewardRuleUpdateDto))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}