using System.Data;
using DuckDB.NET.Data;
using Microsoft.IdentityModel.Tokens;
using RewardStringParser;
using RewardStringParser.RewardModels;

namespace Backend.Application.Services;

public sealed class ValidationEngine(
    IDbConnectionFactory mysqlFactory,
    IConfiguration config,
    IRewardTabBuilder rewardTabBuilder,
    DuckDbOperations duckDb,
    ILogger<ValidationEngine> logger
)
{
    public async Task<ICollection<ErrorDetailDto>> ValidateEventRulesAsync(
        string team,
        IReadOnlyDictionary<string, DataTable> tabs,
        ICollection<EventRule> eventRules,
        CancellationToken ct)
    {
        if (eventRules.IsNullOrEmpty())
            return [];
        var connectionString = GetConnectionString(team);
        await using var mysqlConn =
            await mysqlFactory.CreateOpenConnectionAsync(team, ct);


        var tableNames = await GetMySqlTableNamesAsync(mysqlConn, ct);
        var tablesNeeded = tableNames
            .Where(t => eventRules.Any(r => r.Query.Contains(t, StringComparison.Ordinal)))
            .Distinct(StringComparer.Ordinal)
            .ToHashSet();

        using var conn = new DuckDBConnection("Data Source=:memory:");
        conn.Open();
        duckDb.LoadMySqlScanner(conn);
        duckDb.InsertIntoDuckDb(conn, connectionString, tabs, tablesNeeded);

        var errors = new LinkedList<ErrorDetailDto>();

        foreach (var rule in eventRules)
        {
            try
            {
                var invalid = duckDb.ExecuteQuery(conn, rule.Query);
                if (invalid.Rows.Count == 0)
                    continue;

                for (var idx = 0; idx < invalid.Rows.Count; ++idx)
                {
                    var row = invalid.Rows[idx];
                    var tabName = ErrorAttribution.FindTabByRow(tabs, row, rule.Query);

                    var rowId = invalid.Columns.Contains("Id")
                        ? ErrorAttribution.TryGetInt(row["Id"]) ?? (idx + 2)
                        : (idx + 2);

                    errors.AddLast(new ErrorDetailDto(
                        tabName,
                        rowId + 1,
                        rule.ErrorMessage
                    ));
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Rule execution failed (ruleId={RuleId})", rule.Id);
                errors.AddLast(new ErrorDetailDto("Unknown", 0, $"Rule failed: {rule.Name} ({rule.Id})"));
            }
        }

        return errors;
    }

    public async Task<ICollection<ErrorDetailDto>> ValidateRewardRulesAsync(
        string team,
        IReadOnlyDictionary<string, DataTable> tabs,
        ICollection<RewardRule> rewardRules,
        CancellationToken ct)
    {
        if (rewardRules.Count == 0)
            return [];
        var connectionString = GetConnectionString(team);
        await using var mysqlConn =
            await mysqlFactory.CreateOpenConnectionAsync(team, ct);


        var tableNames = await GetMySqlTableNamesAsync(mysqlConn, ct);

        var errors = new LinkedList<ErrorDetailDto>();

        foreach (var rule in rewardRules)
        {
            if (!tabs.TryGetValue(rule.Tab, out var tab))
            {
                errors.AddLast(new ErrorDetailDto(rule.Tab, $"Tab '{rule.Tab}' not found for rule '{rule.Name}'"));
                continue;
            }

            if (!tab.Columns.Contains(rule.Column))
            {
                errors.AddLast(new ErrorDetailDto(rule.Tab,
                    $"Column '{rule.Column}' not found in tab '{rule.Tab}' for rule '{rule.Name}'"));
                continue;
            }


            foreach (var ruleQuery in rule.Queries)
            {
                var tablesNeeded = tableNames
                    .Where(t => ruleQuery.Query.Contains(t, StringComparison.Ordinal))
                    .ToHashSet();

                foreach (var row in tab.AsEnumerable())
                {
                    var columnValue = Convert.ToString(row[rule.Column]) ?? "";
                    if (string.IsNullOrWhiteSpace(columnValue))
                    {
                        {
                            errors.AddLast(new ErrorDetailDto(rule.Tab,
                                $"Empty value in column '{rule.Column}' for rule '{rule.Name}'"));
                            continue;
                        }
                    }

                    try
                    {
                        var invalidResult = await ValidateRewards(
                            connectionString,
                            tabs,
                            tablesNeeded,
                            ruleQuery.Query,
                            columnValue,
                            ct);
                        invalidResult.Match(
                            succ =>
                            {
                                if (succ.Rows.Count > 0)
                                    errors.AddLast(new ErrorDetailDto(rule.Tab, row.Table.Rows.IndexOf(row) + 2,
                                        ruleQuery.ErrorMessage));
                            },
                            fail => errors.AddLast(new ErrorDetailDto(rule.Tab,
                                $"Reward rule '{rule.Name}' validation error: {fail.Message}")
                            ));
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Reward rule execution failed (ruleId={RuleId})", rule.Id);
                        errors.AddLast(new ErrorDetailDto(rule.Tab, 0,
                            $"Reward rule failed: {rule.Name} ({rule.Id})"));
                    }
                }
            }
        }

        return errors;
    }

    private async Task<Fin<DataTable>> ValidateRewards(
        string connectionString,
        IReadOnlyDictionary<string, DataTable> eventTabs,
        IReadOnlySet<string> tablesNeeded,
        string query,
        string rawReward,
        CancellationToken ct)
    {
        try
        {
            var parseResult = Parse(rawReward);
            if (parseResult.IsFail)
                return Fin.Fail<DataTable>(((Fin<RewardsBucket>.Fail)parseResult).Error.Message);
            var reward = ((Fin<RewardsBucket>.Succ)parseResult).Value;
            var rewardTabs = rewardTabBuilder.BuildTabs(reward);
            if(rewardTabs.Count == 0)
                return Fin.Succ(new DataTable());
            var mergedTabs = new Dictionary<string, DataTable>(eventTabs);
            foreach (var (tabName, dataTable) in rewardTabs)
            {
                mergedTabs.TryAdd(tabName, dataTable);
            }
            await using var conn = new DuckDBConnection($"Data Source=:memory:");
            await conn.OpenAsync(ct);
            duckDb.LoadMySqlScanner(conn);
            duckDb.InsertIntoDuckDb(conn, connectionString, mergedTabs, tablesNeeded);
            var invalid = duckDb.ExecuteQuery(conn, query);
            return Fin.Succ(invalid);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating rewards with query: {Query}", query);
            return Fin.Fail<DataTable>($"Error validating rewards: {ex.Message}");
        }
    }

    private static Fin<RewardsBucket> Parse(string reward)
    {
        try
        {
            var res = PackParser.Parse(reward);
            return Fin.Succ(res);
        }
        catch (Exception ex)
        {
            return Fin.Fail<RewardsBucket>($"Failed to parse reward string {reward}, error: {ex.Message}");
        }
    }

    public ICollection<ErrorDetailDto> ValidateSchema(IReadOnlyDictionary<string, ICollection<string>> schema,
        IReadOnlyDictionary<string, DataTable> sheetTabs, CancellationToken ct = default)
    {
        if (schema.IsNullOrEmpty())
            return [];
        var errors = new LinkedList<ErrorDetailDto>();
        foreach (var (name, columns) in schema)
        {
            if (!sheetTabs.TryGetValue(name, out var table))
            {
                errors.AddLast(new ErrorDetailDto(name, 0, $"Expected tab '{name}' not found"));
                continue;
            }

            foreach (var col in columns.Where(c => !string.IsNullOrWhiteSpace(c) && !table.Columns.Contains(c)))
            {
                errors.AddLast(new ErrorDetailDto(name, 0, $"Expected column '{col}' not found in tab '{name}'"));
            }
        }

        return errors;
    }

    private static async Task<IReadOnlyList<string>> GetMySqlTableNamesAsync(MySqlConnection conn,
        CancellationToken ct)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
                          SELECT table_name
                          FROM information_schema.tables
                          WHERE table_schema = DATABASE()
                          """;

        var names = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var name = reader.GetString(0);
            if (!name.StartsWith("_", StringComparison.Ordinal))
                names.Add(name);
        }

        return names;
    }

    private string GetConnectionString(string team)
        => config.GetConnectionString(team)
           ?? throw new InvalidOperationException(
               $"Missing connection string: {team}");

}