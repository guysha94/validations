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


        Logger.LogInformation("Updating event {id}, DTO: {@Dto}", id, dto);
        var dbEvent = dto.ToEvent(id);
        var e = await repo.UpdateOneAsync(id, dbEvent, ct);
        await Send.OkAsync(e, ct);
    }
}