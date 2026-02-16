using Backend.Audit;

namespace Backend.Events.Endpoints;

public class UpdateOne(IEventRepository repo, IAuditService audit) : Endpoint<EventUpdateDto, Event?>
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
            async e =>
            {
                if (e.IsNone)
                {
                    await Send.NotFoundAsync(ct);
                }
                else
                {
                    await audit.LogAsync("update", "event", id.ToString(), null, "anonymous", "backend",
                        new { type = dto.Type, label = dto.Label }, null, ct);
                    await Send.OkAsync(e.Case as Event, ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}