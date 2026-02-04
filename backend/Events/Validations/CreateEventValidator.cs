

namespace Backend.Events.Validations;

public class CreateEventValidator: Validator<EventCreateDto>
{
    public CreateEventValidator()
    {
        RuleFor(p => p.Type)
            .NotEmpty()
            .WithMessage("Type is required")
            .NotNull()
            .WithMessage("Type is required")
            .Matches(@"^\S+$")
            .WithMessage("Type must not contain whitespace characters");
    }
}