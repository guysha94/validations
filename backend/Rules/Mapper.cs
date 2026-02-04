namespace Backend.Rules;

public static class Mapper
{
    public static Rule ToRule(this RuleCreateDto dto) =>
        new()
        {
            EventId = Guid.Parse(dto.EventId),
            Name = dto.Name,
            ErrorMessage = dto.ErrorMessage,
            Query = dto.Query,
            Enabled = dto.Enabled ?? true,
        };
}