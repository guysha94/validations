namespace Backend.Validation.Validations;

public class ValidateRequestValidator : Validator<ValidateRequest>
{
    public ValidateRequestValidator()
    {
        RuleFor(p => p.EventType)
            .NotEmpty()
            .WithMessage($"{nameof(ValidateRequest.EventType)} is required")
            .NotNull()
            .WithMessage($"{nameof(ValidateRequest.EventType)} is required");

        RuleFor(p => p.Url)
            .NotEmpty()
            .WithMessage($"{nameof(ValidateRequest.Url)} is required")
            .NotNull()
            .WithMessage($"{nameof(ValidateRequest.Url)} is required")
            .Must(uri => Uri.IsWellFormedUriString(uri, UriKind.Absolute))
            .WithMessage($"{nameof(ValidateRequest.Url)} must be a valid URL");

        RuleFor(p => p.Team)
            .NotEmpty()
            .WithMessage($"{nameof(ValidateRequest.Team)} is required")
            .NotNull()
            .WithMessage($"{nameof(ValidateRequest.Team)} is required");
    }
}