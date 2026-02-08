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

        var result = await repo.GetByIdAsync(id, ct);
        await result.Match(
            r => r.IsNone
                ? Send.NotFoundAsync(ct)
                : Send.OkAsync(r.Case as Rule, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}