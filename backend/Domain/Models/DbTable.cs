namespace Backend.Domain.Models;

public record DbTable
{
    public string Name { get; set; } = string.Empty;
    public LanguageExt.HashSet<string> Columns { get; set; } = [];
}