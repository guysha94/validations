namespace Backend.EventRules.Endpoints;

public class GetAll(IEventRuleRepository repo)
    : EndpointWithoutRequest<IEnumerable<EventRule>>
{
    public override void Configure()
    {
        Get("event-rules");
        AllowAnonymous();
        Tags("EventRules");
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