namespace Backend.Rules.Endpoints;

public class GetAll(IRuleRepository repo)
    : EndpointWithoutRequest<IEnumerable<Rule>>
{
    public override void Configure()
    {
        Get("rules");
        AllowAnonymous();
        Tags("Rules");
        ResponseCache(60);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var events = await repo.GetAllAsync(ct);
        await Send.OkAsync(events, ct);
    }
}