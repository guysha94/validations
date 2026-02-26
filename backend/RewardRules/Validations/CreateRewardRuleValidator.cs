namespace Backend.RewardRules.Validations;

public class CreateRewardRuleValidator : Validator<RewardRuleCreateDto>
{
    public CreateRewardRuleValidator()
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

        RuleFor(r => r.Tab)
            .NotEmpty()
            .WithMessage("Tab is required")
            .NotNull()
            .WithMessage("Tab is required")
            .MaximumLength(255)
            .WithMessage("Tab must be at most 255 characters long");

        RuleFor(r => r.Column)
            .NotEmpty()
            .WithMessage("Column is required")
            .NotNull()
            .WithMessage("Column is required")
            .MaximumLength(255)
            .WithMessage("Column must be at most 255 characters long");

        RuleFor(r => r.Queries)
            .NotNull()
            .WithMessage("Queries is required")
            .Must(q => q != null && q.All(x => !string.IsNullOrWhiteSpace(x.Query) && !string.IsNullOrWhiteSpace(x.ErrorMessage)))
            .WithMessage("Each query must have a non-empty query string and error message");
    }
}
