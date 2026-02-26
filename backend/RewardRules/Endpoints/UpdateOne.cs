using Backend.Audit;

namespace Backend.RewardRules.Endpoints;

public class UpdateOne(IRewardRuleRepository repo, IAuditService audit) : Endpoint<RewardRuleUpdateDto, RewardRule>
{
    public override void Configure()
    {
        Put("reward-rules/{id}");
        AllowAnonymous();
        Validator<UpdateRewardRuleValidator>();
        Tags("RewardRules");
    }

    public override async Task HandleAsync(RewardRuleUpdateDto dto, CancellationToken ct)
    {
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(id))
        {
            await Send.ErrorsAsync(StatusCodes.Status400BadRequest, ct);
            return;
        }

        var result = await repo.UpdateOneAsync(id, dto, ct);
        await result.Match(
            async r =>
            {
                if (r.IsNone)
                {
                    await Send.NotFoundAsync(ct);
                }
                else
                {
                    await audit.LogAsync("update", "reward_rule", id, null, "anonymous", "backend",
                        new { name = dto.Name }, null, ct);
                    await Send.OkAsync(r.Case as RewardRule, ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}
