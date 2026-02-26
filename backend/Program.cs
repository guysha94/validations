using System.Data;
using ConsoleTables;
using RewardStringParser;
using Scalar.AspNetCore;

var builder = WebApplication.CreateSlimBuilder(args);
builder.Services.AddGoogleSheetsService(builder.Configuration);
SqlMapper.AddTypeHandler(new JsonTypeHandler<IDictionary<string, ICollection<string>>>());
SqlMapper.AddTypeHandler(new JsonTypeHandler<LanguageExt.HashSet<string>>());
SqlMapper.AddTypeHandler(new JsonTypeHandler<List<string>>());
SqlMapper.AddTypeHandler(new JsonTypeHandler<ICollection<string>>());
SqlMapper.AddTypeHandler(new JsonTypeHandler<List<RewardRuleQuery>>());
SqlMapper.AddTypeHandler(new JsonTypeHandler<ICollection<RewardRuleQuery>>());
// builder.Services.UpdateDbSchema(builder.Configuration);
builder.Services
    .AddFastEndpoints()
    .AddResponseCaching();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<IRewardTabBuilder, RewardTabBuilder>();
builder.Services.AddScoped<ValidationService>();
builder.Services.AddSingleton<IAuditService, AuditService>();
builder.Services.AddSingleton<IDbConnectionFactory, MySqlConnectionFactory>();
builder.Services.AddScoped<IMySqlSession, MySqlSession>();
builder.Services.AddScoped<IEventRuleRepository, EventRuleRepository>();
builder.Services.AddScoped<IRewardRuleRepository, RewardRuleRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<SheetsFetcher>();
builder.Services.AddScoped<DuckDbOperations>();
builder.Services.AddScoped<ValidationEngine>();


builder.Services.AddOpenApi();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapGet("/", async (IDbConnectionFactory factory) =>
    {
        await using var conn = await factory.CreateOpenConnectionAsync();
        var id = Guid.NewGuid().ToString("N");
        var id2 = "5cd7b5d6-93ed-49be-8b67-4545052c7aa2";
        const string sql = """
                            INSERT INTO `testings` (`id`, `name`) VALUES (@id, 'test'); SELECT LAST_INSERT_ID();
                           """;
        var result = await conn.ExecuteAsync(sql, new { id = id2 });
        return Results.Ok(new { id, result });
    });
    app.MapGet("/test", async (SheetsFetcher service) =>
    {
        var results = await service.GetSheetTablesAsync(
            "https://docs.google.com/spreadsheets/d/1CHRsCynlgXytIxDnLa7Za49ps9dokS_4IjzJ2D0BZQo/edit?gid=992819321#gid=992819321");
        Console.Clear();
        foreach (var (tabName, dataTable) in results)
        {
            var consoleTable = new ConsoleTable(dataTable.Columns.Cast<DataColumn>().Select(c => c.ColumnName).ToArray())
            {
                Options = { NumberAlignment = Alignment.Left }
            };
            foreach (DataRow row in dataTable.Rows)
                consoleTable.AddRow(row.ItemArray);
            Console.WriteLine($"Tab: {tabName}");
            consoleTable.Write();
        }
        return Results.Ok(new { TabCount = results.Count, Tabs = results.Keys });
    });
    app.MapScalarApiReference("/docs", opt =>
    {
        opt
            .WithTitle("Validation Service API")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .SortTagsAlphabetically()
            .SortOperationsByMethod()
            .PreserveSchemaPropertyOrder()
            .EnableDarkMode();
    });
}

app.UseCors();
// app.UseAuthentication()
//     .UseAuthorization()
//     .UseFastEndpoints();
app.UseResponseCaching()
    .UseFastEndpoints(c => { c.Endpoints.RoutePrefix = "api"; });

app.Run();