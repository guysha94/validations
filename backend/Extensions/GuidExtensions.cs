using System.Globalization;

namespace Backend.Extensions;

public static class GuidExtensions
{
    extension(Guid guid)
    {
        public DateTimeOffset CreationTime()
        {
            var hex = guid.ToString("N").AsSpan();

            if (hex[12] != '7')
                throw new ArgumentException("GUID is not version 7.", nameof(guid));

            var timestampMs = long.Parse(hex[..12], NumberStyles.HexNumber, CultureInfo.InvariantCulture);

            return DateTimeOffset.FromUnixTimeMilliseconds(timestampMs);
        }
    }
}