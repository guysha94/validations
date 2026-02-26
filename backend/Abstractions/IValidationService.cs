namespace Backend.Abstractions;

public interface IValidationService
{
    Task<ValidateResponseDto> ValidateAsync(ValidateRequestDto request, CancellationToken ct = default);
}