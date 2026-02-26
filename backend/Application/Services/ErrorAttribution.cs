using System.Data;

namespace Backend.Application.Services;

/// <summary>
/// Maps invalid DuckDB result rows back to sheet tab names and row numbers.
/// Extracted from ValidationEngine for readability and testability.
/// </summary>
public static class ErrorAttribution
{
    public static string FindTabByRow(
        IReadOnlyDictionary<string, DataTable> sheetTabs,
        DataRow invalidRow,
        string ruleQuery)
    {
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

        foreach (var tabName in sheetTabs.Keys)
        {
            if (ruleQuery.Contains(tabName, StringComparison.Ordinal))
                return tabName;
        }

        return "Unknown";
    }

    public static int? TryGetInt(object? v)
    {
        if (v is null || v is DBNull)
            return null;

        if (v is int i)
            return i;

        return int.TryParse(Convert.ToString(v), out var parsed) ? parsed : null;
    }
}
