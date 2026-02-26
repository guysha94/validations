namespace Backend.RewardRules.Endpoints;

public class GetOne(IRewardRuleRepository repo) : EndpointWithoutRequest<RewardRule>
{
    public override void Configure()
    {
        Get("reward-rules/{id}");
        AllowAnonymous();
        Tags("RewardRules");
        ResponseCache(60);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(id))
        {
            await Send.ErrorsAsync(StatusCodes.Status400BadRequest, ct);
            return;
        }

        var result = await repo.GetByIdAsync(id, ct);
        await result.Match(
            r => r.IsNone
                ? Send.NotFoundAsync(ct)
                : Send.OkAsync(r.Case as RewardRule, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}
