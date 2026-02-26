namespace Backend.Application.Services;

public sealed class ValidationService(
    ILogger<ValidationService> logger,
    ValidationEngine engine,
    SheetsFetcher sheetsFetcher,
    IEventRuleRepository eventRuleRepository,
    IRewardRuleRepository rewardRuleRepository,
    IEventRepository eventRepository
) : IValidationService
{
    public async Task<ValidateResponseDto> ValidateAsync(ValidateRequestDto request, CancellationToken ct = default)
    {
        try
        {
            var (eventType, url, team) = request;
            var eventData = await eventRepository.GetByEventTypeAsync(eventType, ct);
            if (eventData is null)
                return ReturnInvalid("Event type not found");


            var tabs = await sheetsFetcher.GetSheetTablesAsync(url, ct: ct);
            if (tabs.Count == 0)
                return ReturnInvalid("No sheets found at the provided URL");

            var eventRuleTask = eventRuleRepository.GetByEventTypeAsync(eventType, team, ct);
            var rewardRuleTask = rewardRuleRepository.GetByEventTypeAsync(eventType, team, ct);

            var schemaValidationResult = engine.ValidateSchema(eventData.Schema.AsReadOnly(), tabs, ct);
            var eventRulesFin = await eventRuleTask;
            var rewardRulesFin = await rewardRuleTask;

            if (eventRulesFin.IsFail)
            {
                logger.LogError(((Fin<ICollection<EventRule>>.Fail)eventRulesFin).Error, "Failed to load event rules");
                return ReturnInvalid("Failed to load event rules. Please try again.");
            }
            if (rewardRulesFin.IsFail)
            {
                logger.LogError(((Fin<ICollection<RewardRule>>.Fail)rewardRulesFin).Error, "Failed to load reward rules");
                return ReturnInvalid("Failed to load reward rules. Please try again.");
            }

            var eventRules = ((Fin<ICollection<EventRule>>.Succ)eventRulesFin).Value;
            var rewardRules = ((Fin<ICollection<RewardRule>>.Succ)rewardRulesFin).Value;

            var eventRulesValidationResult = await engine.ValidateEventRulesAsync(team, tabs, eventRules, ct);
            var rewardRulesValidationResult = await engine.ValidateRewardRulesAsync(team, tabs, rewardRules, ct);

            var mergedErrors = (schemaValidationResult ?? [])
                .Concat(eventRulesValidationResult ?? [])
                .Concat(rewardRulesValidationResult ?? []);

            return ValidateResponseDto.Create(mergedErrors);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during validation");
            return ReturnInvalid("An error occurred during validation. Please check the URL and try again.");
        }
    }

    private static ValidateResponseDto ReturnInvalid(string error) => ValidateResponseDto.Invalid([new(error)]);
}