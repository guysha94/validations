using Event = Backend.Domain.Models.Event;

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
[JsonSerializable(typeof(RewardRuleQuery))]
[JsonSerializable(typeof(List<RewardRuleQuery>))]
[JsonSerializable(typeof(RewardRule))]
[JsonSerializable(typeof(IEnumerable<RewardRule>))]
[JsonSerializable(typeof(ValidateRequest))]
[JsonSerializable(typeof(ValidateResponse))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}