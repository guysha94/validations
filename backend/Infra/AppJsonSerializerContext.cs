using Rule = Backend.Rules.Rule;
using Backend.Domain;

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
[JsonSerializable(typeof(Event))]
[JsonSerializable(typeof(IEnumerable<Event>))]
[JsonSerializable(typeof(EventCreateDto))]
[JsonSerializable(typeof(EventUpdateDto))]
[JsonSerializable(typeof(RuleCreateDto))]
[JsonSerializable(typeof(RuleUpdateDto))]
[JsonSerializable(typeof(RuleUpdateManyDto))]
[JsonSerializable(typeof(ValidateRequestDto))]
[JsonSerializable(typeof(ValidateResponseDto))]
[JsonSerializable(typeof(ErrorDetailDto))]
[JsonSerializable(typeof(List<ErrorDetailDto>))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}