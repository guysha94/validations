
namespace Backend.EventRules.Endpoints;

public class CreateOne(IEventRuleRepository repo, IAuditService audit) : Endpoint<EventRuleCreateDto, EventRule?>
{
    public override void Configure()
    {
        Post("event-rules");
        AllowAnonymous();
        Validator<CreateEventRuleValidator>();
        Tags("EventRules");
    }

    public override async Task HandleAsync(EventRuleCreateDto dto, CancellationToken ct)
    {
        var result = await repo.CreateOneAsync(dto.ToEventRule(), ct);
        await result.Match(
            async r =>
            {
                if (r.IsNone)
                {
                    await Send.ResultAsync(Results.Problem("Failed to create rule"));
                }
                else
                {
                    var rule = r.Case as EventRule;
                    var ruleId = rule!.Id.ToString();
                    await audit.LogAsync("create", "event_rule", ruleId, null, "anonymous", "backend",
                        new { eventId = dto.EventId, name = dto.Name }, null, ct);
                    await Send.CreatedAtAsync<GetOne>(new { id = rule.Id }, cancellation: ct);
                }
            },
            errors => Send.ResultAsync(Results.InternalServerError(errors))
        );
    }
}