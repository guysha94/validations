using Backend.Application.Services;
using Backend.Domain.Configs;
using Scalar.AspNetCore;

var builder = WebApplication.CreateSlimBuilder(args);
builder.Services.AddOptions<GoogleSheetsOptions>()
    .Bind(builder.Configuration.GetSection(GoogleSheetsOptions.SectionName));
builder.Services.UpdateDbSchema(builder.Configuration);
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

builder.Services.AddSingleton<IDbConnectionFactory, MySqlConnectionFactory>();
builder.Services.AddScoped<IMySqlSession, MySqlSession>();
builder.Services.AddScoped<IRuleRepository, RuleRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddSingleton<SheetsFetcher>();
builder.Services.AddScoped<ValidationEngine>();


builder.Services.AddOpenApi();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
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


app.UseCors();
// app.UseAuthentication()
//     .UseAuthorization()
//     .UseFastEndpoints();
app.UseResponseCaching()
    .UseFastEndpoints(c => { c.Endpoints.RoutePrefix = "api"; });
app.Run();