namespace Backend.Rules.Endpoints;

public class GetAll(IRuleRepository repo)
    : EndpointWithoutRequest<IEnumerable<Rule>>
{
    public override void Configure()
    {
        Get("rules");
        AllowAnonymous();
        Tags("Events");
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