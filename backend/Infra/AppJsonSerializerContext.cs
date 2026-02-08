using Event = Backend.Events.Event;
using Rule = Backend.Rules.Rule;

namespace Backend.Infra;

[JsonSourceGenerationOptions(
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull)]
[JsonSerializable(typeof(EventColumn))]
[JsonSerializable(typeof(Event))]
[JsonSerializable(typeof(Rule))]
[JsonSerializable(typeof(IEnumerable<Rule>))]
[JsonSerializable(typeof(IEnumerable<string>))]
[JsonSerializable(typeof(List<string>))]
[JsonSerializable(typeof(string[]))]
[JsonSerializable(typeof(IEnumerable<Event>))]
[JsonSerializable(typeof(EventCreateDto))]
[JsonSerializable(typeof(EventUpdateDto))]
[JsonSerializable(typeof(RuleCreateDto))]
[JsonSerializable(typeof(RuleUpdateDto))]
[JsonSerializable(typeof(RuleUpdateManyDto))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}