namespace Backend.Validation.Validations;

public class ValidateRequestValidator : Validator<ValidateRequestDto>
{
    public ValidateRequestValidator()
    {
        RuleFor(p => p.EventType)
            .NotEmpty()
            .WithMessage($"{nameof(ValidateRequestDto.EventType)} is required")
            .NotNull()
            .WithMessage($"{nameof(ValidateRequestDto.EventType)} is required");

        RuleFor(p => p.Url)
            .NotEmpty()
            .WithMessage($"{nameof(ValidateRequestDto.Url)} is required")
            .NotNull()
            .WithMessage($"{nameof(ValidateRequestDto.Url)} is required")
            .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
            .WithMessage($"{nameof(ValidateRequestDto.Url)} must be a valid URL");

        RuleFor(p => p.Team)
            .NotEmpty()
            .WithMessage($"{nameof(ValidateRequestDto.Team)} is required")
            .NotNull()
            .WithMessage($"{nameof(ValidateRequestDto.Team)} is required");
    }
}