using Ardalis.SmartEnum;

namespace Backend.Domain.Models;

/// <summary>
/// Result status of a validation run. Used in <see cref="ValidateResponse"/> and rule execution.
/// </summary>
public sealed class ValidationStatus : SmartEnum<ValidationStatus, string>
{
    /// <summary>All rules passed; no invalid rows found.</summary>
    public static readonly ValidationStatus Valid = new ValidationStatus(nameof(Valid), nameof(Valid).ToLower());

    /// <summary>One or more rules found invalid rows.</summary>
    public static readonly ValidationStatus Invalid = new ValidationStatus(nameof(Invalid), nameof(Invalid).ToLower());

    private ValidationStatus(string name, string value) : base(name, value)
    {
    }

    /// <summary>
    /// Converts a string to <see cref="ValidationStatus"/>. Accepts both value ("valid"/"invalid") and name ("Valid"/"Invalid").
    /// </summary>
    /// <exception cref="ArgumentException">Thrown when the string does not match a known status.</exception>
    public static implicit operator ValidationStatus(string value)
    {
        if (TryFromValue(value, out var status) || TryFromName(value, true, out status))
        {
            return status;
        }

        throw new ArgumentException($"Invalid value for ValidationStatus: {value}");
    }
}