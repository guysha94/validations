using System.Diagnostics;
using Backend.Application.Services;
using Backend.Audit;
using Backend.Validation.Validations;

namespace Backend.Validation.Endpoints;

public class Validate(ILogger<Validate> logger, ValidationEngine engine, IAuditService audit) :
    Endpoint<ValidateRequestDto, ValidateResponseDto>
{
    public override void Configure()
    {
        Post("validate");
        AllowAnonymous();
        Validator<ValidateRequestValidator>();
        Tags("Rules");
    }

    public override async Task HandleAsync(ValidateRequestDto dto, CancellationToken ct)
    {
        logger.LogInformation("Received validation request, info: {@Info}", dto);
        var sw = Stopwatch.StartNew();
        var result = await engine.ValidateAsync(dto, ct);
        var durationMs = sw.ElapsedMilliseconds;

        await Send.OkAsync(result, ct);

        var urlTruncated = string.IsNullOrEmpty(dto.Url)
            ? null
            : dto.Url.Length <= 50 ? dto.Url : dto.Url[..50] + "...";
        await audit.LogAsync(
            "validate",
            "validation",
            null,
            null,
            "anonymous",
            "backend",
            new { eventType = dto.EventType, url = urlTruncated, team = dto.Team },
            new { duration_ms = durationMs, status = result.Status, error_count = result.Errors.Count },
            ct);
    }
}