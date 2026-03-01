using Event = Backend.Domain.Models.Event;

namespace Backend.Presentation.Api.Processors.Audits;

public class AuditsPreProcessor : PreProcessor<ValidateRequest, RequestContext>
{
    public override Task PreProcessAsync(IPreProcessorContext<ValidateRequest> context, RequestContext state,
        CancellationToken ct)
    {
        var req = context.Request;
        state.StartTimestamp = Stopwatch.GetTimestamp();
        state.Audit = new()
        {
            Id = state.CorrelationId.ToString(),
            TeamSlug =  req.Team,
            Action = "validate",
            EntityType = nameof(Event).ToLower(),
            EntityId = req.EventType,
            ActorType = "team",
            ActorId = req.Team,
        };
        return Task.CompletedTask;
    }
}