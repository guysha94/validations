using Backend.Application.Services;
using Backend.Domain;
using FastEndpoints;

namespace Backend.Events.Endpoints;

public class RunValidation(ValidationEngine engine):Endpoint<ValidateRequestDto, ValidateResponseDto>
{
    public override void Configure()
    {
        Post("validate");
        AllowAnonymous();
        Tags("Validations");
    }

    public override async Task HandleAsync(ValidateRequestDto req, CancellationToken ct)
    {
        var result = await engine.ValidateAsync(req.EventType, req.Url, ct);
        await Send.OkAsync(result, ct);
    }
    
}