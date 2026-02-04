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
        var rule = await repo.CreateOneAsync(dto.ToRule(), ct);
        if (rule is null)
        {
            await Send.ErrorsAsync(StatusCodes.Status500InternalServerError, ct);
            return;
        }

        await Send.CreatedAtAsync<GetOne>(new { id = rule.Id }, rule, cancellation: ct);
    }
}