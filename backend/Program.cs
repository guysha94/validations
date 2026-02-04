using Backend.Infra.Configs;
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


app.UseCors();
// app.UseAuthentication()
//     .UseAuthorization()
//     .UseFastEndpoints();
app.UseResponseCaching()
    .UseFastEndpoints(c => { c.Endpoints.RoutePrefix = "api"; });
app.Run();