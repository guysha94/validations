namespace Backend.Abstractions;

public interface IValidationService
{
    Task<ValidateResponse> ValidateAsync(ValidateRequest request, CancellationToken ct = default);
}