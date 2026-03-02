using Event = Backend.Domain.Models.Event;

namespace Backend.Presentation.Api.Processors.Audits;

public sealed class AuditsPostProcessor : PostProcessor<ValidateRequest, RequestContext, ValidateResponse>
{
    public override async Task PostProcessAsync(IPostProcessorContext<ValidateRequest, ValidateResponse> context,
        RequestContext state,
        CancellationToken ct)
    {
        var logger = context.HttpContext.Resolve<ILogger<AuditsPostProcessor>>();
        var auditService = context.HttpContext.TryResolve<IAuditService>();
        if (auditService is null)
        {
            logger.LogWarning("AuditService not available, skipping audit logging.");
            return;
        }

        var req = context.Request;
        var res = context.Response;
        
        
        var (startTimestamp, duration, correlationId) = state;
        var startTime = DateTimeOffset.FromUnixTimeMilliseconds(startTimestamp).DateTime.ToString("O");
        var audit = new Audit
        {
            Id = string.IsNullOrWhiteSpace(correlationId)? Guid.CreateVersion7().ToString() : correlationId,
            TeamSlug = req.Team,
            Action = "validate",
            EntityType = nameof(Event).ToLower(),
            EntityId = req.EventType,
            ActorType = "team",
            ActorId = req.Team,
            Source = "backend",
            Metadata = new Dictionary<string, object>
            {
                ["durationMilliseconds"] = duration.ToString("F3"),
                ["StartTimestamp"] = startTime,
            },
            Payload = new Dictionary<string, object>
            {
                ["url"] = req.Url,
                ["result"] = res.Status.Value,
                ["errors"] = res.ErrorMessage
            }
        };

        try
        {
            await auditService.LogAsync(audit, ct);
            logger.LogAuditLogged(audit);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to log audit: {@Audit}", audit);
        }
    }
}