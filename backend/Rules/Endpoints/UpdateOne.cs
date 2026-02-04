namespace Backend.Rules.Endpoints;

public class UpdateOne(IRuleRepository repo) : Endpoint<RuleUpdateDto, Rule>
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

        var rule = await repo.UpdateOneAsync(id, dto, ct);
        if (rule is null)
        {
            await Send.ErrorsAsync(StatusCodes.Status404NotFound, ct);
            return;
        }

        await Send.OkAsync(rule, ct);
    }
}