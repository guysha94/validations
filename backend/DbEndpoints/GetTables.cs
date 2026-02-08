using Backend.Domain.Models;

namespace Backend.DbEndpoints;

public class GetTableNames(IDbConnectionFactory connectionFactory) : EndpointWithoutRequest<ICollection<DbTable>>
{
    private const string QUERY = """
                                 SELECT
                                     TABLE_NAME as Name,
                                     CONCAT('[', GROUP_CONCAT(JSON_QUOTE(COLUMN_NAME) ORDER BY ORDINAL_POSITION), ']') AS Columns
                                 FROM INFORMATION_SCHEMA.COLUMNS
                                 WHERE TABLE_SCHEMA = 'backend'
                                 AND LOWER(TABLE_NAME) NOT like '%migration%'
                                 GROUP BY TABLE_NAME;
                                 """;

    public override void Configure()
    {
        Get("db-tables");
        AllowAnonymous();
        Tags("Database");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        var result = await connection.QueryAsync<DbTable>(
            new CommandDefinition(QUERY, cancellationToken: ct)
        );

        await Send.OkAsync(result.ToArray(), ct);
    }
}