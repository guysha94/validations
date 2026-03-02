namespace Backend.Infra;

public sealed class KeyPropertyResolver : IKeyPropertyResolver
{
    public ColumnPropertyInfo[] ResolveKeyProperties(Type type)
    {
        return new[] { new ColumnPropertyInfo(type.GetProperty("Id")!, isKey: true) };
    }
}