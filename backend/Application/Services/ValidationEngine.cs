using System.Data;
using System.Diagnostics;
using Backend.Validation;
using DuckDB.NET.Data;
using Microsoft.IdentityModel.Tokens;
using Event = Backend.Events.Event;

namespace Backend.Application.Services;

public sealed class ValidationEngine(
    SheetsFetcher sheetsFetcher,
    IRuleRepository ruleRepository,
    IEventRepository eventRepository,
    IDbConnectionFactory mysqlFactory,
    IConfiguration config,
    ILogger<ValidationEngine> logger
)
{
    public async Task<ValidateResponseDto> ValidateAsync(ValidateRequestDto dto, CancellationToken ct)
    {
        var (eventType, url, team) = dto;
        var connectionString = GetConnectionString(team);
        var sw = Stopwatch.GetTimestamp();

        var eventData = await eventRepository.GetByEventTypeAsync(eventType, ct);
        var sheetTabsRaw = await sheetsFetcher.GetSheetValuesByUrl(url, ct);
        var sheetTabs = sheetTabsRaw.ToDictionary(
            kvp => kvp.Key,
            kvp => ToDataTableWithHeader(kvp.Key, kvp.Value),
            StringComparer.Ordinal
        );

        var schemaErrors = ValidateSchema(eventData, sheetTabs);
        if (schemaErrors.Count > 0)
        {
            logger.LogWarning("Schema validation failed, info: {@Info}", new
            {
                Request = dto,
                SchemaErrors = schemaErrors,
            });
            return new ValidateResponseDto("invalid", schemaErrors);
        }

        var rules = await ruleRepository.GetByEventTypeAsync(eventType, team, ct);

        await using var mysqlConn =
            await mysqlFactory.CreateOpenConnectionAsync(team, ct);


        var tableNames = await GetMySqlTableNamesAsync(mysqlConn, ct);
        var tablesNeeded = tableNames
            .Where(t => rules.Any(r => r.Query.Contains(t, StringComparison.Ordinal)))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        await using var conn = new DuckDBConnection("DataSource=:memory:");
        await conn.OpenAsync(ct);
        LoadMySqlScanner(conn);


        InsertIntoDuckDb(conn, connectionString, sheetTabs, tablesNeeded);

        var errors = new List<ErrorDetailDto>();

        foreach (var rule in rules)
        {
            try
            {
                var invalid = ExecuteQuery(conn, rule.Query);
                if (invalid.Rows.Count == 0)
                    continue;

                for (var idx = 0; idx < invalid.Rows.Count; idx++)
                {
                    var row = invalid.Rows[idx];
                    var tabName = FindTabByRow(sheetTabs, row, rule.Query);

                    var rowId = invalid.Columns.Contains("Id")
                        ? TryGetInt(row["Id"]) ?? (idx + 2)
                        : (idx + 2);
                    
                    errors.Add(new ErrorDetailDto(
                        tabName,
                        rowId + 1,
                        rule.ErrorMessage
                    ));
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Rule execution failed (ruleId={RuleId})", rule.Id);
                errors.Add(new ErrorDetailDto("Unknown", 0, $"Rule failed: {rule.Name} ({rule.Id})"));
            }
        }

        var duration = Stopwatch.GetElapsedTime(sw).TotalMilliseconds;
        logger.LogInformation(
            "Validation completed in {ElapsedMs:N}ms: eventType={EventType} rules={RuleCount} errors={ErrorCount}",
            duration, eventType, rules.Count, errors.Count
        );

        return errors.Count > 0
            ? new ValidateResponseDto("invalid", errors)
            : new ValidateResponseDto("valid", []);
    }

    private ICollection<ErrorDetailDto> ValidateSchema(Event eventData, IDictionary<string, DataTable> sheetTabs)
    {
        var schema = eventData.Schema;
        if (schema.IsNullOrEmpty())
            return [];
        var errors = new List<ErrorDetailDto>();
        foreach (var (name, columns) in schema)
        {
            if (!sheetTabs.TryGetValue(name, out var table))
            {
                errors.Add(new ErrorDetailDto(name, 0, $"Expected tab '{name}' not found"));
                continue;
            }

            foreach (var col in columns)
            {
                if (!table.Columns.Contains(col.Name))
                {
                    errors.Add(new ErrorDetailDto(name, 0, $"Expected column '{col.Name}' not found in tab '{name}'"));
                }
            }
        }

        return errors;
    }

    private static async Task<IReadOnlyList<string>> GetMySqlTableNamesAsync(MySqlConnection conn, CancellationToken ct)
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

    private async Task<DataTable?> LoadMySqlTableAsync(MySqlConnection conn, string tableName, CancellationToken ct)
    {
        if (!IsSafeIdentifier(tableName))
        {
            logger.LogWarning("Skipping unsafe MySQL table name: {TableName}", tableName);
            return null;
        }

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT * FROM `{tableName}`";

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        var table = new DataTable(tableName);
        table.Load(reader);
        return table;
    }

    private string GetConnectionString(string team)
        => config.GetConnectionString(team)
           ?? throw new InvalidOperationException(
               $"Missing connection string: {team}");

    private static bool IsSafeIdentifier(string name)
        => !string.IsNullOrWhiteSpace(name) && name.All(ch => char.IsLetterOrDigit(ch) || ch == '_');

    private static void InsertIntoDuckDb(
        DuckDBConnection conn,
        string mysqlConnectionString,
        IReadOnlyDictionary<string, DataTable> sheetTabs,
        IReadOnlyCollection<string> mysqlTables
    )
    {
        foreach (var (name, table) in sheetTabs)
        {
            CreateTableFromDataTable(conn, name, table);
        }

        foreach (var tableName in mysqlTables)
        {
            ExecNonQuery(conn, $@"
            CREATE OR REPLACE VIEW ${tableName} AS
            SELECT *
            FROM mysql_scan('{mysqlConnectionString}', '{tableName}');
        ");
        }
    }

    private static void CreateTableFromDataTable(DuckDBConnection conn, string tableName, DataTable table)
    {
        var tmpPath = Path.Combine(Path.GetTempPath(), $"validation-service-{Guid.NewGuid():N}-{tableName}.csv");
        WriteCsv(table, tmpPath);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"""
                           DROP TABLE IF EXISTS {QuoteIdent(tableName)};
                           CREATE TABLE {QuoteIdent(tableName)} AS
                           SELECT * FROM read_csv_auto('{EscapeForSqlLiteral(tmpPath)}', HEADER=true);
                           """;
        cmd.ExecuteNonQuery();

        try
        {
            File.Delete(tmpPath);
        }
        catch
        {
            // best-effort cleanup
        }
    }

    private static DataTable ExecuteQuery(DuckDBConnection conn, string sql)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        using var reader = cmd.ExecuteReader();
        var dt = new DataTable();
        dt.Load(reader);
        return dt;
    }

    private static string FindTabByRow(IReadOnlyDictionary<string, DataTable> sheetTabs, DataRow invalidRow,
        string ruleQuery)
    {
        // Try to match by common columns (excluding Id), like the Python merge logic.
        foreach (var (tabName, df) in sheetTabs)
        {
            if (df.Rows.Count == 0)
                continue;

            var commonColumns = df.Columns
                .Cast<DataColumn>()
                .Select(c => c.ColumnName)
                .Where(c => !c.Equals("Id", StringComparison.OrdinalIgnoreCase))
                .Where(c => invalidRow.Table.Columns.Contains(c))
                .ToArray();

            if (commonColumns.Length == 0)
                continue;

            foreach (DataRow candidate in df.Rows)
            {
                var allMatch = true;
                foreach (var c in commonColumns)
                {
                    var a = Convert.ToString(invalidRow[c]) ?? "";
                    var b = Convert.ToString(candidate[c]) ?? "";
                    if (!string.Equals(a, b, StringComparison.Ordinal))
                    {
                        allMatch = false;
                        break;
                    }
                }

                if (allMatch)
                    return tabName;
            }
        }

        // Fallback: if query mentions a tab name.
        foreach (var tabName in sheetTabs.Keys)
        {
            if (ruleQuery.Contains(tabName, StringComparison.Ordinal))
                return tabName;
        }

        return "Unknown";
    }

    private static DataTable ToDataTableWithHeader(string name, string[][] rows)
    {
        var dt = new DataTable(name);
        if (rows.Length == 0)
            return dt;

        var header = rows[0];
        var headerNames = header.Select(h => string.IsNullOrWhiteSpace(h) ? "Column" : h.Trim()).ToArray();

        // Ensure unique column names.
        var seen = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < headerNames.Length; i++)
        {
            var baseName = headerNames[i];
            if (!seen.TryAdd(baseName, 0))
            {
                seen[baseName]++;
                headerNames[i] = $"{baseName}_{seen[baseName]}";
            }
        }

        foreach (var col in headerNames)
        {
            dt.Columns.Add(col, typeof(string));
        }

        // Add Id column if missing (match Python behavior: insert at position 0)
        if (!dt.Columns.Cast<DataColumn>().Any(c => c.ColumnName.Equals("Id", StringComparison.OrdinalIgnoreCase)))
        {
            dt.Columns.Add("Id", typeof(int));
            dt.Columns["Id"]!.SetOrdinal(0);
        }

        for (var i = 1; i < rows.Length; i++)
        {
            var row = rows[i];
            var dr = dt.NewRow();

            // Id is 1..n for data rows
            dr["Id"] = i;

            for (var c = 0; c < headerNames.Length && c < row.Length; c++)
            {
                dr[headerNames[c]] = row[c] ?? "";
            }

            dt.Rows.Add(dr);
        }

        return dt;
    }

    private static int? TryGetInt(object? v)
    {
        if (v is null || v is DBNull)
            return null;

        if (v is int i)
            return i;

        return int.TryParse(Convert.ToString(v), out var parsed) ? parsed : null;
    }

    private static string QuoteIdent(string name) => $"\"{name.Replace("\"", "\"\"")}\"";

    private static void WriteCsv(DataTable table, string path)
    {
        using var writer = new StreamWriter(path);

        // Header
        writer.WriteLine(string.Join(",", table.Columns.Cast<DataColumn>().Select(c => EscapeCsv(c.ColumnName))));

        foreach (DataRow row in table.Rows)
        {
            var values = table.Columns.Cast<DataColumn>()
                .Select(c => EscapeCsv(Convert.ToString(row[c]) ?? ""));
            writer.WriteLine(string.Join(",", values));
        }
    }

    private static string EscapeCsv(string s)
    {
        if (s.Contains('"') || s.Contains(',') || s.Contains('\n') || s.Contains('\r'))
        {
            return $"\"{s.Replace("\"", "\"\"")}\"";
        }

        return s;
    }

    private static string EscapeForSqlLiteral(string s) => s.Replace("'", "''");

    private static void LoadMySqlScanner(DuckDBConnection conn)
    {
        ExecNonQuery(conn, "INSTALL mysql_scanner;");
        ExecNonQuery(conn, "LOAD mysql_scanner;");
    }

    static void ExecNonQuery(DuckDBConnection con, string sql)
    {
        using var cmd = con.CreateCommand();
        cmd.CommandText = sql;
        cmd.ExecuteNonQuery();
    }
}