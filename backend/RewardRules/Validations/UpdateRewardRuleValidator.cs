namespace Backend.RewardRules.Validations;

public class UpdateRewardRuleValidator : Validator<RewardRuleUpdateDto>
{
    public UpdateRewardRuleValidator()
    {
        RuleFor(r => r.Name)
            .MaximumLength(255)
            .When(r => r.Name is not null);

        RuleFor(r => r.Tab)
            .MaximumLength(255)
            .When(r => r.Tab is not null);

        RuleFor(r => r.Column)
            .MaximumLength(255)
            .When(r => r.Column is not null);

        RuleFor(r => r.EditAccess)
            .MaximumLength(32)
            .When(r => r.EditAccess is not null);
    }
}
