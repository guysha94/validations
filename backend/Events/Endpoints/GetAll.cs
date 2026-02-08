namespace Backend.Events.Endpoints;

public class GetAll(IEventRepository repo)
    : EndpointWithoutRequest<IEnumerable<Event>>
{
    public override void Configure()
    {
        Get("events");
        AllowAnonymous();
        Tags("Events");
        ResponseCache(60);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var results = await repo.GetAllAsync(ct);
        await results.Match(
            events => Send.OkAsync(events, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}