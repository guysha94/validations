namespace Backend.EventRules.Validations;

public class CreateEventRuleValidator : Validator<EventRuleCreateDto>
{
    public CreateEventRuleValidator()
    {
        RuleFor(p => p.EventId)
            .NotEmpty()
            .WithMessage("EventId is required")
            .NotNull()
            .WithMessage("EventId is required")
            .Must(e => Guid.TryParse(e, out var g) && g.Version == 7)
            .WithMessage("EventId must be a valid UUIDv7");

        RuleFor(r => r.Name)
            .NotEmpty()
            .WithMessage("Name is required")
            .NotNull()
            .WithMessage("Name is required")
            .MaximumLength(255)
            .WithMessage("Name must be at most 255 characters long");

        RuleFor(r => r.ErrorMessage)
            .NotEmpty()
            .WithMessage("ErrorMessage is required")
            .NotNull()
            .WithMessage("ErrorMessage is required")
            .MaximumLength(500)
            .WithMessage("ErrorMessage must be at most 500 characters long");

        RuleFor(r => r.Query)
            .NotNull()
            .WithMessage("Query is required");
    }
}
