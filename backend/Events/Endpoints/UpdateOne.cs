namespace Backend.Events.Endpoints;

public class UpdateOne(IEventRepository repo) : Endpoint<EventUpdateDto, Event?>
{
    public override void Configure()
    {
        Put("/events/{id}");
        AllowAnonymous();
        Tags("Events");
    }

    public override async Task HandleAsync(EventUpdateDto dto, CancellationToken ct)
    {
        var id = Route<Guid>("id");

        var dbEvent = dto.ToEvent(id);
        var result = await repo.UpdateOneAsync(id, dbEvent, ct);
        await result.Match(
            e => e.IsNone
                ? Send.NotFoundAsync(ct)
                : Send.OkAsync(e.Case as Event, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}