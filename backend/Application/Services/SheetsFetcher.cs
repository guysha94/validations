using Backend.Infra.Configs;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;
using Microsoft.Extensions.Options;

namespace Backend.Application.Services;

public sealed class SheetsFetcher(IOptions<GoogleSheetsOptions> options, ILogger<SheetsFetcher> logger)
{
    private static readonly string[] Scopes = { SheetsService.Scope.SpreadsheetsReadonly };

    public async Task<IDictionary<string, string[][]>> GetSheetValuesByUrl(string urlOrId,
        CancellationToken ct = default)
    {
        var spreadsheetId = ExtractSpreadsheetId(urlOrId);

        var credential = CreateCredential(options.Value);

        using var service = new SheetsService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential.CreateScoped(Scopes)
        });

        var request = service.Spreadsheets.Get(spreadsheetId);
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

    private static GoogleCredential CreateCredential(GoogleSheetsOptions o)
    {
        if (!string.IsNullOrWhiteSpace(o.CredentialsPath))
        {
            return CredentialFactory
                .FromFile<ServiceAccountCredential>(o.CredentialsPath)
                .ToGoogleCredential();
        }


        return GoogleCredential.GetApplicationDefault();
    }

    private static string ExtractSpreadsheetId(string urlOrId)
    {
        const string marker = "/d/";
        var idx = urlOrId.IndexOf(marker, StringComparison.Ordinal);
        if (idx < 0)
            return urlOrId.Trim();

        var start = idx + marker.Length;
        var end = urlOrId.IndexOf('/', start);
        if (end < 0)
            return urlOrId[start..].Trim();

        return urlOrId[start..end].Trim();
    }
}