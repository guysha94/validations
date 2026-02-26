
namespace Backend.EventRules.Endpoints;

public class UpdateOne(IEventRuleRepository repo, IAuditService audit) : Endpoint<EventRuleUpdateDto, EventRule>
{
    public override void Configure()
    {
        Put("event-rules/{id}");
        AllowAnonymous();
        Validator<UpdateEventRuleValidator>();
        Tags("EventRules");
    }

    public override async Task HandleAsync(EventRuleUpdateDto dto, CancellationToken ct)
    {
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(id))
        {
            await Send.ErrorsAsync(StatusCodes.Status400BadRequest, ct);
            return;
        }

        var result = await repo.UpdateOneAsync(id, dto, ct);
        await result.Match(
            async r =>
            {
                if (r.IsNone)
                {
                    await Send.NotFoundAsync(ct);
                }
                else
                {
                    await audit.LogAsync("update", "event_rule", id, null, "anonymous", "backend",
                        new { name = dto.Name }, null, ct);
                    await Send.OkAsync(r.Case as EventRule, ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}