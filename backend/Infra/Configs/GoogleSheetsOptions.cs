namespace Backend.Infra.Configs;

public sealed record GoogleSheetsOptions
{
    public const string SectionName = "GoogleSheets";
    public string? CredentialsPath { get; init; }
}