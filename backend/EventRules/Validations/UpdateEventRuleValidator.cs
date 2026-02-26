namespace Backend.EventRules.Validations;

public class UpdateEventRuleValidator : Validator<EventRuleUpdateDto>
{
    public UpdateEventRuleValidator()
    {
        RuleFor(r => r.Name)
            .MaximumLength(255)
            .When(r => r.Name is not null);

        RuleFor(r => r.Description)
            .MaximumLength(1000)
            .When(r => r.Description is not null);

        RuleFor(r => r.ErrorMessage)
            .MaximumLength(500)
            .When(r => r.ErrorMessage is not null);

        RuleFor(r => r.EditAccess)
            .MaximumLength(32)
            .When(r => r.EditAccess is not null);
    }
}
