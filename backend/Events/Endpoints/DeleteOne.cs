using Backend.Audit;

namespace Backend.Events.Endpoints;

public class DeleteOne(IEventRepository repo, IAuditService audit) : EndpointWithoutRequest<object>
{
    public override void Configure()
    {
        Delete("events/{id}");
        AllowAnonymous();
        Tags("Events");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(id))
        {
            await Send.ErrorsAsync(StatusCodes.Status400BadRequest, ct);
            return;
        }

        var result = await repo.DeleteOneAsync(id, ct);
        await result.Match(
            async deleted =>
            {
                if (deleted)
                {
                    await audit.LogAsync("delete", "event", id.ToString(), null, "anonymous", "backend",
                        null, null, ct);
                }
                await Send.OkAsync(new { deleted }, ct);
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}