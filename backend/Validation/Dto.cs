namespace Backend.Validation;

public sealed record ValidateRequestDto(
    string EventType,
    string Url,
    string Team
);

public sealed record ErrorDetailDto(
    string TabName,
    int RowNumber,
    string ErrorMessage
)
{
    public ErrorDetailDto(string errorMessage) : this("", 0, errorMessage)
    {
    }

    public ErrorDetailDto(string tabName, string errorMessage) : this(tabName, 0, errorMessage)
    {
        
    }
}

public sealed record ValidateResponseDto(
    string Status, // "valid" | "invalid"
    ICollection<ErrorDetailDto> Errors
)
{
    public static ValidateResponseDto Valid() => new("valid", []);
    public static ValidateResponseDto Invalid(IEnumerable<ErrorDetailDto> errors) => new("invalid", errors.ToList());

    public static ValidateResponseDto Create(IEnumerable<ErrorDetailDto>? errors)
    {
        var errorList = errors?.ToList() ?? [];
        return errorList.Count == 0 ? Valid() : Invalid(errorList);
    }
}