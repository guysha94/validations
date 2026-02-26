namespace Backend.RewardRules.Endpoints;

public class GetAll(IRewardRuleRepository repo) : EndpointWithoutRequest<IEnumerable<RewardRule>>
{
    public override void Configure()
    {
        Get("reward-rules");
        AllowAnonymous();
        Tags("RewardRules");
        ResponseCache(60);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await repo.GetAllAsync(ct);
        await result.Match(
            rules => Send.OkAsync(rules, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}
