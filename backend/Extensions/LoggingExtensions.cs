namespace Backend.Extensions;

public static partial class LoggingExtensions
{
    [LoggerMessage(
        EventId = 0,
        EventName = "ValidationRequestReceived",
        Level = LogLevel.Information,
        Message = "Received validation request, info: {@Info}")]
    public static partial void LogValidationRequest(this ILogger logger, ValidateRequest info);

    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Information,
        Message = "Audit logged successfully: {@Audit}",
        EventName = "AuditLogged"
    )]
    public static partial void LogAuditLogged(this ILogger logger, Audit audit);
}