using Backend.Audit;

namespace Backend.Rules.Endpoints;

public class CreateOne(IRuleRepository repo, IAuditService audit) : Endpoint<RuleCreateDto, Rule?>
{
    public override void Configure()
    {
        Post("rules");
        AllowAnonymous();
        Validator<CreateRuleValidator>();
        Tags("Rules");
    }

    public override async Task HandleAsync(RuleCreateDto dto, CancellationToken ct)
    {
        var result = await repo.CreateOneAsync(dto.ToRule(), ct);
        await result.Match(
            async r =>
            {
                if (r.IsNone)
                {
                    await Send.ResultAsync(Results.Problem("Failed to create rule"));
                }
                else
                {
                    var rule = r.Case as Rule;
                    var ruleId = rule!.Id.ToString();
                    await audit.LogAsync("create", "rule", ruleId, null, "anonymous", "backend",
                        new { eventId = dto.EventId, name = dto.Name }, null, ct);
                    await Send.CreatedAtAsync<GetOne>(new { id = rule.Id }, cancellation: ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}