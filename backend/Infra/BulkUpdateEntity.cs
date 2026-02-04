namespace Backend.Infra;

public readonly record struct BulkUpdateEntity<TKey, TEntity>(TKey Id, TEntity Entity);