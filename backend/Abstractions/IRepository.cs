namespace Backend.Abstractions;

public interface IRepository<TEntity, TKey, in TEntityCreate, in TEntityUpdate> : IDisposable, IAsyncDisposable
    where TEntity : class
    where TKey : notnull
{
    ValueTask<Fin<IEnumerable<TEntity>>> GetAllAsync(CancellationToken ct = default);

    ValueTask<Fin<Option<TEntity>>> GetByIdAsync(TKey id, CancellationToken ct = default);

    ValueTask<Fin<Option<TEntity>>> CreateOneAsync(TEntityCreate entity, CancellationToken ct = default);
    ValueTask<Fin<Option<TEntity>>> CreateOneAsync(TEntity entity, CancellationToken ct = default);

    ValueTask<Fin<Option<TEntity>>> UpdateOneAsync(TKey id, TEntityUpdate entity, CancellationToken ct = default);
    ValueTask<Fin<Option<TEntity>>> UpdateOneAsync(TKey id, TEntity entity, CancellationToken ct = default);

    ValueTask<Fin<bool>> DeleteOneAsync(TKey id, CancellationToken ct = default);

    ValueTask<Fin<int>> DeleteManyAsync(IEnumerable<TKey> ids, CancellationToken ct = default);

    ValueTask<Fin<int>> CreateManyAsync(IEnumerable<TEntityCreate> entities, CancellationToken ct = default);
}