using Scalar.AspNetCore;


var builder = WebApplication.CreateSlimBuilder(args);
builder.Services
    .AddDbMappers()
    .AddGoogleSheetsService(builder.Configuration);

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
builder.Services.AddScoped<SheetsFetcher>();
builder.Services.AddScoped<DuckDbOperations>();
builder.Services.AddScoped<ValidationEngine>();


builder.Services.AddOpenApi();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    // app.MapGet("/test", async (SheetsFetcher service) =>
    // {
    //     var results = await service.GetSheetTablesAsync(
    //         "https://docs.google.com/spreadsheets/d/1CHRsCynlgXytIxDnLa7Za49ps9dokS_4IjzJ2D0BZQo/edit?gid=992819321#gid=992819321");
    //     Console.Clear();
    //     foreach (var (tabName, dataTable) in results)
    //     {
    //         var consoleTable = new ConsoleTable(dataTable.Columns.Cast<DataColumn>().Select(c => c.ColumnName).ToArray())
    //         {
    //             Options = { NumberAlignment = Alignment.Left }
    //         };
    //         foreach (DataRow row in dataTable.Rows)
    //             consoleTable.AddRow(row.ItemArray);
    //         Console.WriteLine($"Tab: {tabName}");
    //         consoleTable.Write();
    //     }
    //     return Results.Ok(new { TabCount = results.Count, Tabs = results.Keys });
    // });
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
app.UseResponseCaching()
    .UseFastEndpoints(c => { c.Endpoints.RoutePrefix = "api"; });

app.Run();