namespace Backend.EventRules;

public static class Mapper
{
    public static EventRule ToEventRule(this EventRuleCreateDto dto) =>
        new()
        {
            EventId = dto.EventId,
            Name = dto.Name,
            Description = dto.Description,
            ErrorMessage = dto.ErrorMessage,
            Query = dto.Query,
            Enabled = dto.Enabled ?? true,
            EditAccess = dto.EditAccess,
        };
}