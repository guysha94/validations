using Event = Backend.Domain.Models.Event;

namespace Backend.Application.Services;

public sealed class ValidationService(
    ILogger<ValidationService> logger,
    ValidationEngine engine,
    SheetsFetcher sheetsFetcher,
    IDbConnectionFactory connectionFactory
) : IValidationService
{
    public async Task<ValidateResponse> ValidateAsync(ValidateRequest request, CancellationToken ct = default)
    {
        var (eventType, url, team) = request;
        try
        {
            var eventData = await GetEventDataAsync(eventType, ct);
            if (eventData is null)
                return ReturnInvalid(eventType, team, "Event type not found");


            var tabs = await sheetsFetcher.GetSheetTablesAsync(url, ct: ct);
            if (tabs.Count == 0)
                return ReturnInvalid(eventData.Id, eventData.TeamId, "No sheets found at the provided URL");

            var errors = engine.ValidateSchema(eventData.Schema.AsReadOnly(), tabs, ct).ToList();

            if (eventData.EventRules.Count > 0)
            {
                var eventRulesErrors = await engine.ValidateEventRulesAsync(team, tabs, eventData.EventRules, ct);
                errors.AddRange(eventRulesErrors);
            }

            if (eventData.RewardRules.Count > 0)
            {
                var rewardRulesErrors = await engine.ValidateRewardRulesAsync(team, tabs, eventData.RewardRules, ct);
                errors.AddRange(rewardRulesErrors);
            }

            return ValidateResponse.Create(eventData.Id, eventData.TeamId, errors);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during validation");
            return ReturnInvalid(eventType, team,
                "An error occurred during validation. Please check the URL and try again.");
        }
    }


    private async ValueTask<Event?> GetEventDataAsync(string eventType, CancellationToken ct)
    {
        try
        {
            await using var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
            var events = await connection.SelectAsync<Event, EventRule, RewardRule, Event>(
                e => e.Id == eventType || e.Type == eventType,
                (e, eventRule, rewardRule) =>
                {
                    e.EventRules ??= [];
                    e.RewardRules ??= [];
                    e.EventRules = e.EventRules.Append(eventRule).ToHashSet();
                    e.RewardRules = e.RewardRules.Append(rewardRule).ToHashSet();
                    return e;
                }, buffered: true, cancellationToken: ct);
            return events?.FirstOrDefault();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching event data for event type {EventType}", eventType);
            return null;
        }
    }

    private static ValidateResponse ReturnInvalid(string eventId, string teamId, string error) =>
        ValidateResponse.Invalid(eventId, teamId, [new(error)]);
}