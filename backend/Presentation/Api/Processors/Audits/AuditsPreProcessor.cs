namespace Backend.Presentation.Api.Processors.Audits;

public sealed class AuditsPreProcessor : PreProcessor<ValidateRequest, RequestContext>
{
    public override Task PreProcessAsync(IPreProcessorContext<ValidateRequest> context, RequestContext state,
        CancellationToken ct)
    {
        state.StartTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        return Task.CompletedTask;
    }
}