namespace Backend.Rules.Endpoints;

public class GetOne(IRuleRepository repo)
    : EndpointWithoutRequest<Rule>
{
    public override void Configure()
    {
        Get("rules/{id}");
        AllowAnonymous();
        Tags("Rules");
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

        var rule = await repo.GetByIdAsync(id, ct);
        if (rule is null)
        {
            await Send.ErrorsAsync(StatusCodes.Status404NotFound, ct);
            return;
        }

        await Send.OkAsync(rule, ct);
    }
}