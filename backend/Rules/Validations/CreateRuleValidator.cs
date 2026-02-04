namespace Backend.Rules.Validations;

public class CreateRuleValidator : Validator<RuleCreateDto>
{
    public CreateRuleValidator()
    {
        RuleFor(p => p.EventId)
            .NotEmpty()
            .WithMessage("Type is required")
            .NotNull()
            .WithMessage("Type is required")
            .Must(e => Guid.TryParse(e, out var g) && g.Version == 7)
            .WithMessage("EventId must be a valid UUIDv7");

        RuleFor(r => r.Name)
            .NotEmpty()
            .WithMessage("Name is required")
            .NotNull()
            .WithMessage("Name is required")
            .MaximumLength(100)
            .WithMessage("Name must be at most 100 characters long");

        RuleFor(r => r.ErrorMessage)
            .NotEmpty()
            .WithMessage("ErrorMessage is required")
            .NotNull()
            .WithMessage("ErrorMessage is required")
            .MaximumLength(255)
            .WithMessage("ErrorMessage must be at most 255 characters long");
        RuleFor(r => r.Query)
            .NotEmpty()
            .WithMessage("Query is required")
            .NotNull()
            .WithMessage("Query is required");
    }
}