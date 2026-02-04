namespace Backend.Abstractions;

public interface IRepository<TEntity, TKey, in TEntityCreate, in TEntityUpdate> : IDisposable, IAsyncDisposable
    where TEntity : class
    where TKey : notnull
{
    ValueTask<IEnumerable<TEntity>> GetAllAsync(CancellationToken ct = default);

    ValueTask<TEntity?> GetByIdAsync(TKey id, CancellationToken ct = default);

    ValueTask<TEntity?> CreateOneAsync(TEntityCreate entity, CancellationToken ct = default);
    ValueTask<TEntity?> CreateOneAsync(TEntity entity, CancellationToken ct = default);

    ValueTask<TEntity?> UpdateOneAsync(TKey id, TEntityUpdate entity, CancellationToken ct = default);
    ValueTask<TEntity?> UpdateOneAsync(TKey id, TEntity entity, CancellationToken ct = default);

    ValueTask<bool> DeleteOneAsync(TKey id, CancellationToken ct = default);

    ValueTask<int> DeleteManyAsync(IEnumerable<TKey> ids, CancellationToken ct = default);

    ValueTask<int> CreateManyAsync(IEnumerable<TEntityCreate> entities, CancellationToken ct = default);
}