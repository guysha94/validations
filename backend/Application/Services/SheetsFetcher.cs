using System.Collections.ObjectModel;
using System.Data;
using System.Text.RegularExpressions;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;

namespace Backend.Application.Services;

public sealed partial class SheetsFetcher(SheetsService sheetsService, ILogger<SheetsFetcher> logger)
{
    [GeneratedRegex(@"spreadsheets\/d\/(?<id>[a-zA-Z0-9-_]+)", RegexOptions.Compiled | RegexOptions.IgnoreCase)]
    private static partial Regex IdFromUrl();


    public async Task<IReadOnlyDictionary<string, DataTable>> GetSheetTablesAsync(string spreadsheetUrlOrId,
        string baseRange = "A:ZZ",
        CancellationToken ct = default)
    {
        var valueRanges = await GetValuesForVisibleSheetsAsync(spreadsheetUrlOrId, baseRange, ct);
        var result = new Dictionary<string, DataTable>(valueRanges.Count, StringComparer.Ordinal);
        foreach (var (sheetName, vr) in valueRanges)
        {
            result[sheetName] = ValueRangeToDataTable(sheetName, vr);
        }
        logger.LogInformation("Fetched {TabCount} visible tab(s) as DataTables for sheet {Spreadsheet}", result.Count, spreadsheetUrlOrId);
        return result;
    }

    private static DataTable ValueRangeToDataTable(string name, ValueRange vr)
    {
        var dt = new DataTable(name);
        var values = vr.Values;
        if (values is null || values.Count == 0)
            return dt;

        var rows = values
            .Select(row => (row ?? []).Select(c => c?.ToString() ?? "").ToArray())
            .ToArray();

        var header = rows[0];
        var headerNames = header.Select(h => string.IsNullOrWhiteSpace(h) ? "Column" : h.Trim()).ToArray();

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
            dt.Columns.Add(col, typeof(string));

        if (!dt.Columns.Cast<DataColumn>().Any(c => c.ColumnName.Equals("Id", StringComparison.OrdinalIgnoreCase)))
        {
            dt.Columns.Add("Id", typeof(int));
            dt.Columns["Id"]!.SetOrdinal(0);
        }

        for (var i = 1; i < rows.Length; i++)
        {
            var row = rows[i];
            var dr = dt.NewRow();
            dr["Id"] = i;
            for (var c = 0; c < headerNames.Length && c < row.Length; c++)
                dr[headerNames[c]] = row[c];
            dt.Rows.Add(dr);
        }

        return dt;
    }


    public async Task<IDictionary<string, string[][]>> GetSheetValuesByUrl(string spreadsheetUrlOrId,
        CancellationToken ct = default)
    {
        var spreadsheetId = ExtractSpreadsheetId(spreadsheetUrlOrId);

        var request = sheetsService.Spreadsheets.Get(spreadsheetId);
        request.IncludeGridData = true;
        var response = await request.ExecuteAsync(ct);

        var sheets = response?.Sheets ?? [];

        var result = new Dictionary<string, string[][]>(StringComparer.Ordinal);
        foreach (var sheet in sheets)
        {
            var isHidden = sheet.Properties?.Hidden ?? false;
            if (isHidden)
                continue;

            var title = sheet.Properties?.Title ?? "Unknown";
            var rows = (sheet.Data ?? Enumerable.Empty<GridData>())
                .SelectMany(d => d.RowData ?? [])
                .Select(r => r.Values?.Select(v => v.FormattedValue).ToArray() ?? [])
                .ToArray();

            result[title] = rows;
        }

        logger.LogInformation("Fetched {TabCount} visible tab(s) for sheet {SpreadsheetId}", result.Count,
            spreadsheetId);
        return result;
    }


    private static string ExtractSpreadsheetId(string spreadsheetUrlOrId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(spreadsheetUrlOrId);
        if (!spreadsheetUrlOrId.Contains("spreadsheets/d/", StringComparison.OrdinalIgnoreCase))
            return spreadsheetUrlOrId.Trim();
        var match = IdFromUrl().Match(spreadsheetUrlOrId);
        return !match.Success
            ? throw new ArgumentException("Could not extract spreadsheet id from URL.", nameof(spreadsheetUrlOrId))
            : match.Groups["id"].Value;
    }

    public async Task<IReadOnlyList<string>> GetVisibleSheetTitlesAsync(string spreadsheetUrlOrId,
        CancellationToken ct = default)
    {
        var spreadsheetId = ExtractSpreadsheetId(spreadsheetUrlOrId);

        var request = sheetsService.Spreadsheets.Get(spreadsheetId);


        request.Fields = "sheets(properties(sheetId,title,hidden))";

        var spreadsheet = await request.ExecuteAsync(ct).ConfigureAwait(false);

        var visibleTitles =
            spreadsheet.Sheets?
                .Select(s => s.Properties)
                .Where(p => p is not null && p.Hidden is null or false)
                .Select(p => p!.Title)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct(StringComparer.Ordinal)
                .ToList()
            ?? new List<string>();

        return visibleTitles;
    }

    public async Task<IReadOnlyDictionary<string, ValueRange>> GetValuesForVisibleSheetsAsync(
        string urlOrId,
        string baseRange = "A:Z",
        CancellationToken ct = default)
    {
        try
        {
            var spreadsheetId = ExtractSpreadsheetId(urlOrId);
            var titles = await GetVisibleSheetTitlesAsync(spreadsheetId, ct);
            var ranges = titles.Select(t => $"{EscapeSheetName(t)}!{baseRange}").ToList();

            var batch = sheetsService.Spreadsheets.Values.BatchGet(spreadsheetId);
            batch.Ranges = ranges;

            var resp = await batch.ExecuteAsync(ct);

            var dict = new SortedDictionary<string, ValueRange>(StringComparer.Ordinal);

            if (resp.ValueRanges is null) return dict;
            foreach (var vr in resp.ValueRanges)
            {
                var sheetName = ExtractSheetNameFromA1Range(vr.Range);
                if (!string.IsNullOrWhiteSpace(sheetName))
                    dict[sheetName] = vr;
            }

            return dict;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching sheet values for spreadsheet '{SpreadsheetId}'", urlOrId);
            return new Dictionary<string, ValueRange>();
        }
    }

    private static string EscapeSheetName(string sheetTitle)
        => $"'{sheetTitle.Replace("'", "''")}'";

    private static string ExtractSheetNameFromA1Range(string? a1Range)
    {
        if (string.IsNullOrWhiteSpace(a1Range)) return string.Empty;
        var excl = a1Range.IndexOf('!');
        if (excl <= 0) return string.Empty;

        var left = a1Range[..excl];

        if (left is ['\'', _, ..] && left[^1] == '\'')
        {
            left = left[1..^1].Replace("''", "'");
        }

        return left;
    }
}