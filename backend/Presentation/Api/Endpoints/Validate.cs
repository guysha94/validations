using Backend.Presentation.Api.Processors.Audits;

namespace Backend.Presentation.Api.Endpoints;

public class Validate(
    ILogger<Validate> logger,
    ValidationService service
) :
    Endpoint<ValidateRequest, ValidateResponse>
{
    public override void Configure()
    {
        Post("validate");
        AllowAnonymous();
        Validator<ValidateRequestValidator>();
        PreProcessor<AuditsPreProcessor>();
        PostProcessor<AuditsPostProcessor>();
        Tags("Validations");
    }

    public override async Task HandleAsync(ValidateRequest request, CancellationToken ct)
    {
        logger.LogValidationRequest(request);
        var result = await service.ValidateAsync(request, ct);
        await Send.OkAsync(result, ct);

    }
}