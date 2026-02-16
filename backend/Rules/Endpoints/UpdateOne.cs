using Backend.Audit;

namespace Backend.Rules.Endpoints;

public class UpdateOne(IRuleRepository repo, IAuditService audit) : Endpoint<RuleUpdateDto, Rule>
{
    public override void Configure()
    {
        Put("rules/{id}");
        AllowAnonymous();
        Validator<CreateRuleValidator>();
        Tags("Rules");
    }

    public override async Task HandleAsync(RuleUpdateDto dto, CancellationToken ct)
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
                    await audit.LogAsync("update", "rule", id, null, "anonymous", "backend",
                        new { name = dto.Name }, null, ct);
                    await Send.OkAsync(r.Case as Rule, ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}