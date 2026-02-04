using System.Data;
using System.Text;

namespace Backend.Infra;

public sealed class JsonTypeHandler<T> : SqlMapper.TypeHandler<T?>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public override void SetValue(IDbDataParameter parameter, T? value)
    {
        parameter.Value = value is null
            ? DBNull.Value
            : JsonSerializer.Serialize(value, typeof(T), AppJsonSerializerContext.Default);
    }

    public override T? Parse(object? value)
    {
        if (value is null or DBNull)
            return default;

        string json = value switch
        {
            string s => s,
            ReadOnlyMemory<byte> rom => Encoding.UTF8.GetString(rom.Span),
            byte[] bytes => Encoding.UTF8.GetString(bytes),
            _ => value.ToString() ?? string.Empty
        };

        if (string.IsNullOrWhiteSpace(json))
            return default;
        var context = AppJsonSerializerContext.Default.GetTypeInfo(typeof(T));
        try
        {
            return context is null
                ? JsonSerializer.Deserialize<T>(json, JsonOptions)
                : (T?)JsonSerializer.Deserialize(json, context);
        }
        catch
        {
            return default;
        }
    }
}