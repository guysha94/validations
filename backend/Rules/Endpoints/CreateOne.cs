namespace Backend.Rules.Endpoints;

public class CreateOne(IRuleRepository repo) : Endpoint<RuleCreateDto, Rule?>
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
            r => r.IsNone
                ? Send.ResultAsync(Results.Problem("Failed to create rule"))
                : Send.CreatedAtAsync<GetOne>(new { id = (r.Case as Rule).Id }, cancellation: ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}