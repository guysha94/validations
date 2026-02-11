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
       
        logger.LogInformation("Received validation request, info: {@Info}", dto);
        var result = await engine.ValidateAsync(dto, ct);

        await Send.OkAsync(result, ct);
    }
}