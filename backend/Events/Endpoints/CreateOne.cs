using Backend.Audit;

namespace Backend.Events.Endpoints;

public class CreateOne(IEventRepository repo, IAuditService audit) : Endpoint<EventCreateDto, Event?>
{
    public override void Configure()
    {
        Post("events");
        AllowAnonymous();
        Validator<CreateEventValidator>();
        Tags("Events");
    }

    public override async Task HandleAsync(EventCreateDto dto, CancellationToken ct)
    {
        var result = await repo.CreateOneAsync(dto.ToEvent(), ct);

        await result.Match(
            async e =>
            {
                if (e.IsNone)
                {
                    await Send.ResultAsync(Results.Problem("Failed to create event"));
                }
                else
                {
                    var evt = e.Case as Event;
                    await audit.LogAsync("create", "event", evt!.Id.ToString(), null, "anonymous", "backend",
                        new { type = dto.Type, label = dto.Label }, null, ct);
                    await Send.CreatedAtAsync<GetOne>(new { id = evt.Id }, cancellation: ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}