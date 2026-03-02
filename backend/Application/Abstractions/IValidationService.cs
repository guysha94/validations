namespace Backend.Application.Abstractions;

public interface IValidationService
{
    Task<ValidateResponse> ValidateAsync(ValidateRequest request, CancellationToken ct = default);
}