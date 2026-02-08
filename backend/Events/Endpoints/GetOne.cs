namespace Backend.Events.Endpoints;

public class GetOne(IEventRepository repo)
    : EndpointWithoutRequest<Event>
{
    public override void Configure()
    {
        Get("events/{id}");
        AllowAnonymous();
        Tags("Events");
        ResponseCache(60);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<Guid>("id");
        if (id.Version != 7)
        {
            await Send.ErrorsAsync(StatusCodes.Status400BadRequest, ct);
            return;
        }

        var result = await repo.GetByIdAsync(id, ct);
        await result.Match(
            e => e.IsNone
                ? Send.NotFoundAsync(ct)
                : Send.OkAsync(e.Case as Event, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}