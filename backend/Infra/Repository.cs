using System.Data;

namespace Backend.Infra;

public class Repository<TEntity, TKey, TEntityCreate, TEntityUpdate> :
    IRepository<TEntity, TKey, TEntityCreate, TEntityUpdate>
    where TEntity : class
    where TKey : notnull
{
    protected readonly ILogger<Repository<TEntity, TKey, TEntityCreate, TEntityUpdate>> _logger;
    protected readonly IDbConnectionFactory _connectionFactory;
    private readonly string _tableName;
    private readonly Dictionary<string, ColumnInfo> _columns;
    private readonly string _insertColumnsClause;
    private readonly string _insertParametersClause;
    private readonly string _insertSql;
    private readonly string[] _columnsNames;
    private readonly string _selectAllClause;

    private readonly record struct ColumnInfo(
        string PropertyName,
        string ColumnName,
        bool InInsert,
        bool InUpdate);

    public Repository(
        ILogger<Repository<TEntity, TKey, TEntityCreate, TEntityUpdate>> logger,
        IDbConnectionFactory connectionFactory)
    {
        _logger = logger;
        _connectionFactory = connectionFactory;
        var entityType = typeof(TEntity);
        _tableName = entityType.GetCustomAttributes(typeof(TableAttribute), true)
                         .Cast<TableAttribute>()
                         .FirstOrDefault()?.Name
                     ?? entityType.Name;
        var createType = typeof(TEntityCreate);
        var updateType = typeof(TEntityUpdate);
        var createProperties = createType.GetProperties().Select(p => p.Name).ToHashSet();
        var updateProperties = updateType.GetProperties().Select(p => p.Name).ToHashSet();
        _columns = entityType.GetProperties()
            .Where(p => !p.GetCustomAttributes(typeof(IgnoreAttribute), true).Any())
            .ToDictionary(
                x => x.Name,
                x => new ColumnInfo(x.Name, x.GetCustomAttributes(typeof(ColumnAttribute), true)
                        .Cast<ColumnAttribute>()
                        .FirstOrDefault()?.Name ?? x.Name, createProperties.Contains(x.Name),
                    updateProperties.Contains(x.Name)));
        _columnsNames = _columns.Values.Select(c => c.ColumnName).ToArray();
        _insertColumnsClause = string.Join(", ", _columns.Values.Where(c => c.InInsert).Select(c => c.ColumnName));
        _insertParametersClause =
            string.Join(", ", _columns.Values.Where(c => c.InInsert).Select(i => "@" + i.PropertyName));
        _insertSql =
            "INSERT INTO " + _tableName + " (" + _insertColumnsClause + ") VALUES (" + _insertParametersClause +
            ")";

        var columnsAsProperties = _columns.Values.Select(c => $"`{c.ColumnName}` AS `{c.PropertyName}`");
        _selectAllClause = $"SELECT {string.Join(", ", columnsAsProperties)} FROM {_tableName}";
    }


    public async ValueTask<Fin<IEnumerable<TEntity>>> GetAllAsync(CancellationToken ct = default)
    {
        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var results = await connection.GetAllAsync<TEntity>(cancellationToken: ct);
            return Fin.Succ(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all entities from table {TableName}", _tableName);
            return Fin.Fail<IEnumerable<TEntity>>(ex);
        }
    }

    public async ValueTask<Fin<Option<TEntity>>> GetByIdAsync(TKey id, CancellationToken ct = default)
    {
        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var result = await connection.GetAsync<TEntity>(id, cancellationToken: ct);
            return Fin.Succ(Optional(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving entity with ID {Id} from table {TableName}", id, _tableName);
            return Fin.Fail<Option<TEntity>>(ex);
        }
    }

    public async ValueTask<Fin<Option<TEntity>>> CreateOneAsync(TEntityCreate entity, CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation(_insertSql);
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var result = await connection.QueryFirstOrDefaultAsync<TEntity>(_insertSql, entity);
            return Fin.Succ(Optional(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating entity in table {TableName}", _tableName);
            return Fin.Fail<Option<TEntity>>(ex);
        }
    }

    public async ValueTask<Fin<Option<TEntity>>> CreateOneAsync(TEntity entity, CancellationToken ct = default)
    {
        try
        {
            var insertColumnsClause = string.Join(", ", _columnsNames);
            var insertParametersClause =
                string.Join(", ", _columns.Values.Select(i => $"@{i.PropertyName}"));
            var sql = $"""
                       INSERT INTO {_tableName} ({insertColumnsClause})
                         VALUES ({insertParametersClause});
                         {_selectAllClause} WHERE id = @id;
                       """;
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var result = await connection.QueryFirstOrDefaultAsync<TEntity>(sql, entity);

            return Fin.Succ(Optional(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating entity in table {TableName}", _tableName);
            return Fin.Fail<Option<TEntity>>(ex);
        }
    }

    public async ValueTask<Fin<Option<TEntity>>> UpdateOneAsync(TKey id, TEntityUpdate entity,
        CancellationToken ct = default)
    {
        var setClause = string.Join(',', _columns.Where(p => p.Value.InUpdate)
            .Select(p => $"{p.Value.ColumnName} = @{p.Value.PropertyName}"));

        var sql = $"""
                   UPDATE {_tableName} SET {setClause} WHERE id = @Id;
                     {_selectAllClause} WHERE id = @Id;
                   """;
        var parameters = new DynamicParameters(entity);
        parameters.Add("Id", id);
        try
        {
            _logger.LogInformation(sql);
            _logger.LogInformation("Parameters: {@Parameters}", entity);
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var result = await connection.QueryFirstAsync<TEntity>(sql, parameters);
            return Fin.Succ(Optional(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating entity with ID {Id} in table {TableName}", id, _tableName);
            return Fin.Fail<Option<TEntity>>(ex);
        }
    }

    public async ValueTask<Fin<Option<TEntity>>> UpdateOneAsync(TKey id, TEntity entity, CancellationToken ct = default)
    {
        var setClause = string.Join(',', _columns.Where(p => p.Value.InUpdate)
            .Select(p => $"{p.Value.ColumnName} = @{p.Value.PropertyName}"));

        var sql = $"""
                   UPDATE {_tableName} SET {setClause} WHERE id = @Id;
                     {_selectAllClause} WHERE id = @Id;
                   """;
        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var result = await connection.QueryFirstAsync<TEntity>(sql, entity);
            return Fin.Succ(Optional(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating entity with ID {Id} in table {TableName}", id, _tableName);
            return Fin.Fail<Option<TEntity>>(ex);
        }
    }

    public async ValueTask<Fin<bool>> DeleteOneAsync(TKey id, CancellationToken ct = default)
    {
        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var affectedRows = await connection.ExecuteAsync(
                $"DELETE FROM {_tableName} WHERE id = @id", new { id });
            return Fin.Succ(affectedRows > 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting entity with ID {Id} from table {TableName}", id, _tableName);
            return Fin.Fail<bool>(ex);
        }
    }

    public async ValueTask<Fin<int>> DeleteManyAsync(IEnumerable<TKey> ids, CancellationToken ct = default)
    {
        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var affectedRows = await connection.ExecuteAsync(
                $"DELETE FROM {_tableName} WHERE id IN @ids", new { ids });
            return Fin.Succ(affectedRows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting multiple entities from table {TableName}", _tableName);
            return Fin.Fail<int>(ex);
        }
    }

    public async ValueTask<Fin<int>> CreateManyAsync(IEnumerable<TEntityCreate> entities,
        CancellationToken ct = default)
    {
        var columns = string.Join(", ", _columns);
        var parameters = string.Join(", ", _columns.Select(name => "@" + name));
        var sql = $"INSERT INTO {_tableName} ({columns}) VALUES ({parameters})";
        try
        {
            await using var connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
            var affectedRows = await connection.ExecuteAsync(sql, entities);
            return Fin.Succ(affectedRows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating multiple entities in table {TableName}", _tableName);
            return Fin.Fail<int>(ex);
        }
    }


    public void Dispose()
    {
        _columns.Clear();
    }

    public ValueTask DisposeAsync()
    {
        Dispose();
        return ValueTask.CompletedTask;
    }
}