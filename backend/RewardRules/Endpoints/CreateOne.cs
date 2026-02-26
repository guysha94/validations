using Backend.Audit;

namespace Backend.RewardRules.Endpoints;

public class CreateOne(IRewardRuleRepository repo, IAuditService audit) : Endpoint<RewardRuleCreateDto, RewardRule?>
{
    public override void Configure()
    {
        Post("reward-rules");
        AllowAnonymous();
        Validator<CreateRewardRuleValidator>();
        Tags("RewardRules");
    }

    public override async Task HandleAsync(RewardRuleCreateDto dto, CancellationToken ct)
    {
        var result = await repo.CreateOneAsync(dto.ToRewardRule(), ct);
        await result.Match(
            async r =>
            {
                if (r.IsNone)
                {
                    await Send.ResultAsync(Results.Problem("Failed to create reward rule"));
                }
                else
                {
                    var rule = r.Case as RewardRule;
                    var ruleId = rule!.Id.ToString();
                    await audit.LogAsync("create", "reward_rule", ruleId, null, "anonymous", "backend",
                        new { eventId = dto.EventId, name = dto.Name }, null, ct);
                    await Send.CreatedAtAsync<GetOne>(new { id = rule.Id }, cancellation: ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}
