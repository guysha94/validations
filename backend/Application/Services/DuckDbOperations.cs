using System.Data;
using DuckDB.NET.Data;

namespace Backend.Application.Services;

/// <summary>
/// DuckDB-specific operations: loading sheet/MySQL data, executing queries.
/// Extracted from ValidationEngine for readability and testability.
/// </summary>
public sealed class DuckDbOperations(ILogger<DuckDbOperations> logger)
{
    private const string MySqlAttachSchema = "mysql";

    public void LoadMySqlScanner(DuckDBConnection conn)
    {
        ExecNonQuery(conn, "INSTALL mysql_scanner;");
        ExecNonQuery(conn, "LOAD mysql_scanner;");
    }

    public void InsertIntoDuckDb(
        DuckDBConnection conn,
        string mysqlConnectionString,
        IReadOnlyDictionary<string, DataTable> sheetTabs,
        IReadOnlySet<string> mysqlTables)
    {
        foreach (var (name, table) in sheetTabs)
        {
            CreateTableFromDataTable(conn, name, table);
        }

        if (mysqlTables.Count == 0)
            return;

        var attachStr = ToDuckDbAttachString(mysqlConnectionString);
        ExecNonQuery(conn,
            $"ATTACH '{attachStr.Replace("'", "''")}' AS {MySqlAttachSchema} (TYPE mysql_scanner, READ_ONLY);");

        foreach (var tableName in mysqlTables)
        {
            ExecNonQuery(conn, $@"
            CREATE OR REPLACE VIEW {QuoteIdent(tableName)} AS
            SELECT * FROM {MySqlAttachSchema}.{QuoteIdent(tableName)};
        ");
        }
    }

    public void CreateTableFromDataTable(DuckDBConnection conn, string tableName, DataTable table)
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
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to delete temp CSV {Path}", tmpPath);
        }
    }

    public DataTable ExecuteQuery(DuckDBConnection conn, string sql)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        using var reader = cmd.ExecuteReader();
        var dt = new DataTable();
        dt.Load(reader);
        return dt;
    }

    private static string ToDuckDbAttachString(string mysqlConnectionString)
    {
        var cs = new MySqlConnectionStringBuilder(mysqlConnectionString);
        var parts = new List<string>();
        if (!string.IsNullOrEmpty(cs.Server))
            parts.Add($"host={EscapeAttachValue(cs.Server)}");
        if (!string.IsNullOrEmpty(cs.UserID))
            parts.Add($"user={EscapeAttachValue(cs.UserID)}");
        if (!string.IsNullOrEmpty(cs.Password))
            parts.Add($"password={EscapeAttachValue(cs.Password)}");
        if (!string.IsNullOrEmpty(cs.Database))
            parts.Add($"database={EscapeAttachValue(cs.Database)}");
        if (cs.Port != 0)
            parts.Add($"port={cs.Port}");
        return string.Join(" ", parts);
    }

    private static string EscapeAttachValue(string value)
    {
        if (value.Contains(' ') || value.Contains('=') || value.Contains('\''))
            return $"'{value.Replace("'", "''")}'";
        return value;
    }

    private static string QuoteIdent(string name) => $"\"{name.Replace("\"", "\"\"")}\"";

    private static void WriteCsv(DataTable table, string path)
    {
        using var writer = new StreamWriter(path);

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

    private static void ExecNonQuery(DuckDBConnection con, string sql)
    {
        using var cmd = con.CreateCommand();
        cmd.CommandText = sql;
        cmd.ExecuteNonQuery();
    }
}
