namespace Backend.EventRules.Endpoints;

public class GetOne(IEventRuleRepository repo)
    : EndpointWithoutRequest<EventRule>
{
    public override void Configure()
    {
        Get("event-rules/{id}");
        AllowAnonymous();
        Tags("EventRules");
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
                : Send.OkAsync(r.Case as EventRule, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}