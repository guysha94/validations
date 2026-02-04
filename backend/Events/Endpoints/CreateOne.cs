

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
        var e = await repo.CreateOneAsync(dto.ToEvent(), ct);
        if (e is null)
        {
            await Send.ErrorsAsync(StatusCodes.Status500InternalServerError, ct);
            return;
        }

        await Send.CreatedAtAsync<GetOne>(new { id = e.Id }, e, cancellation: ct);
    }
}