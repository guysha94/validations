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
        var events = await repo.GetAllAsync(ct);
        await Send.OkAsync(events, ct);
    }
}