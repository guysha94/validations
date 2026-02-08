using Backend.Application.Services;
using Backend.Validation.Validations;

namespace Backend.Validation.Endpoints;

public class Validate(ILogger<Validate> logger, ValidationEngine engine) :
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
        var (eventType, url) = dto;
        logger.LogInformation("Received validation request for event type {EventType} and URL {Url}", eventType, url);
        var result = await engine.ValidateAsync(eventType, url, ct);

        await Send.OkAsync(result, ct);
    }
}