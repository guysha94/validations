
namespace Backend.EventRules.Endpoints;

public class DeleteOne(IEventRuleRepository repo, IAuditService audit) : EndpointWithoutRequest<object>
{
    public override void Configure()
    {
        Delete("event-rules/{id}");
        AllowAnonymous();
        Tags("EventRules");
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
                    await audit.LogAsync("delete", "event_rule", id, null, "anonymous", "backend",
                        null, null, ct);
                }
                await Send.OkAsync(new { deleted }, ct);
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}