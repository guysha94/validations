namespace Backend.Domain.Models;

public sealed record RequestContext
{
    public long StartTimestamp { get; set; }

    public double DurationInMilliseconds => Stopwatch
        .GetElapsedTime(StartTimestamp, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()).TotalMilliseconds;
    public string CorrelationId { get; } = Guid.CreateVersion7().ToString();
    
    public void Deconstruct(out long startTimestamp, out double durationInMilliseconds, out string correlationId)
    {
        startTimestamp = StartTimestamp;
        durationInMilliseconds = DurationInMilliseconds;
        correlationId = CorrelationId;
    }
}