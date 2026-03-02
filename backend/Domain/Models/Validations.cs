namespace Backend.Domain.Models;

public readonly record struct ValidateRequest(
    string EventType,
    string Url,
    string Team
);

public readonly record struct ErrorDetails(
    string TabName,
    int RowNumber,
    string ErrorMessage
)
{
    public ErrorDetails(string errorMessage) : this("", 0, errorMessage)
    {
    }

    public ErrorDetails(string tabName, string errorMessage) : this(tabName, 0, errorMessage)
    {
    }
}

public record struct ValidateResponse
{
    public ValidationStatus Status { get; }
    public ICollection<ErrorDetails> Errors { get; }

    [JsonIgnore] public string EventId { get; } = string.Empty;
    [JsonIgnore] public string TeamId { get; } = string.Empty;
    
    [JsonIgnore] public string ErrorMessage => Errors.Count > 0 ? string.Join("; ", Errors.Select(e => e.ErrorMessage)) : string.Empty;

    private ValidateResponse(string eventId, string teamId, ValidationStatus status, ICollection<ErrorDetails> errors)
    {
        EventId = eventId;
        TeamId = teamId;
        Status = status;
        Errors = errors;
    }

    public static ValidateResponse Valid(string eventId, string teamId) =>
        new(eventId, teamId, ValidationStatus.Valid, []);

    public static ValidateResponse Invalid(string eventId, string teamId, IEnumerable<ErrorDetails> errors) =>
        new(eventId, teamId, ValidationStatus.Invalid, errors.ToList());

    public static ValidateResponse Create(string eventId, string teamId, IEnumerable<ErrorDetails>? errors = null)
    {
        var errorList = errors?.ToList() ?? [];
        return errorList.Count == 0 ? Valid(eventId, teamId) : Invalid(eventId, teamId, errorList);
    }
}