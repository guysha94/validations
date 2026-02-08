namespace Backend.Validation;

public sealed record ValidateRequestDto(
    string EventType,
    string Url
);

public sealed record ErrorDetailDto(
    string TabName,
    int RowNumber,
    string ErrorMessage
);

public sealed record ValidateResponseDto(
    string Status, // "valid" | "invalid"
    ICollection<ErrorDetailDto> Errors
);