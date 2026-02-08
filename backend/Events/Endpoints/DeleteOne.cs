namespace Backend.Events.Endpoints;

public class DeleteOne(IEventRepository repo) : EndpointWithoutRequest<object>
{
    public override void Configure()
    {
        Delete("events/{id}");
        AllowAnonymous();
        Tags("Events");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<Guid>("id");
        if (id.Version != 7)
        {
            await Send.ErrorsAsync(StatusCodes.Status400BadRequest, ct);
            return;
        }

        var result = await repo.DeleteOneAsync(id, ct);
        await result.Match(
            deleted => Send.OkAsync(new { deleted }, ct),
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}