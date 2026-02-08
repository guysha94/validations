namespace Backend.Events.Endpoints;

public class CreateOne(IEventRepository repo) : Endpoint<EventCreateDto, Event?>
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
            e => e.IsNone
                ? Send.ResultAsync(Results.Problem("Failed to create event"))
                : Send.CreatedAtAsync<GetOne>(new { id = (e.Case as Event).Id }, cancellation: ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}