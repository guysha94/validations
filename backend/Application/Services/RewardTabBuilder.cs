using System.Data;
using RewardStringParser.RewardModels;

namespace Backend.Application.Services;

public sealed class RewardTabBuilder(ILogger<RewardTabBuilder> logger) : IRewardTabBuilder
{
    private static string[] AllRewardTypes => Enum.GetNames<IReward.RewardTypes>();
    // enum RewardTypes
    // {
    //     CoinsReward,
    //     RollsReward,
    //     TrailEnergyReward,
    //     AllowanceReward,
    //     CardReward,
    //     ChestReward,
    //     PiggyBreakReward,
    //     RandomReward,
    //     StickerPackReward,
    //     RewardsBucket,
    //     BlastPicksReward,
    //     RandomCoinsReward,
    //     RandomRollsReward,
    //     RandomTrailEnergyReward,
    //     RandomBlastPicksReward,
    //     BoosterReward,
    //     DACReward,
    //     DARReward,
    //     RandomDACReward,
    //     RandomDARReward,
    //     DynamicResourceReward,
    //     ChanceReward,
    //     BoxReward,
    //     MissingFormulaReward,
    //     RandomFormulaReward,
    //     RollsReductionAllowanceReward,
    //     PresetReward,
    // }
    private static Dictionary<string, Type> RewardTypeMap = new()
    {
        [nameof(IReward.RewardTypes.CoinsReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RollsReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.TrailEnergyReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.AllowanceReward)] = typeof(AllowanceReward),
        [nameof(IReward.RewardTypes.CardReward)] = typeof(CardReward),
        [nameof(IReward.RewardTypes.ChestReward)] = typeof(ChestReward),
        [nameof(IReward.RewardTypes.PiggyBreakReward)] = typeof(PiggyBreakReward),
        [nameof(IReward.RewardTypes.RandomReward)] = typeof(RandomReward),
        [nameof(IReward.RewardTypes.StickerPackReward)] = typeof(StickerPackReward),
        [nameof(IReward.RewardTypes.RewardsBucket)] = typeof(RewardsBucket),
        [nameof(IReward.RewardTypes.BlastPicksReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RandomCoinsReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RandomRollsReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RandomTrailEnergyReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RandomBlastPicksReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.BoosterReward)] = typeof(BoosterReward),
        [nameof(IReward.RewardTypes.DACReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.DARReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RandomDACReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RandomDARReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.DynamicResourceReward)] = typeof(DynamicResourceReward),
        [nameof(IReward.RewardTypes.ChanceReward)] = typeof(ChanceReward),
        [nameof(IReward.RewardTypes.BoxReward)] = typeof(BoxReward),
        [nameof(IReward.RewardTypes.MissingFormulaReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RandomFormulaReward)] = typeof(SimpleReward),
        [nameof(IReward.RewardTypes.RollsReductionAllowanceReward)] = typeof(RollsReductionAllowanceReward),
        [nameof(IReward.RewardTypes.PresetReward)] = typeof(PresetReward),
    };

    public IReadOnlyDictionary<string, DataTable> BuildTabs(IEnumerable<IReward> rewards)
    {
        var tables = new Dictionary<string, DataTable>();
        foreach (var reward in rewards)
        {
            tables.TryAdd(reward.RewardType.ToString(), new DataTable());
            var table = tables[reward.RewardType.ToString()];
            var columnNames = reward.GetType().GetProperties().Select(p => p.Name).ToArray();
            if (table.Columns.Count == 0)
            {
                foreach (var columnName in columnNames)
                {
                    table.Columns.Add(columnName);
                }
            }

            var row = table.NewRow();
            foreach (var columnName in columnNames)
            {
                try
                {
                    var property = reward.GetType().GetProperty(columnName);
                    row[columnName] = property?.GetValue(reward)?.ToString() ?? string.Empty;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to get property {Property} from reward type {RewardType}",
                        columnName, reward.RewardType);
                    row[columnName] = string.Empty;
                }
            }

            table.Rows.Add(row);

            if (reward is not IContainerReward containerReward)
                continue;

            var innerTables = BuildTabs(containerReward.RewardsBucket);
            foreach (var (tabName, tabTable) in innerTables)
            {
                if (tables.TryAdd(tabName, tabTable))
                    continue;

                var existingTable = tables[tabName];
                foreach (DataRow innerRow in tabTable.Rows)
                {
                    existingTable.Rows.Add(innerRow.ItemArray);
                }
            }
        }

        foreach (var (typName, type) in RewardTypeMap)
        {
            if(tables.ContainsKey(typName))
                continue;
            
            var table = new DataTable();
            var columnNames = type.GetProperties().Select(p => p.Name).ToArray();
            foreach (var columnName in columnNames)
            {
                table.Columns.Add(columnName);
            }
            tables[typName] = table;
        }

        return tables;
    }

    public IReadOnlyDictionary<string, DataTable> BuildTabs(params IReward[] rewards)
        => BuildTabs(rewards.AsEnumerable());

    public IReadOnlyDictionary<string, DataTable> BuildTabs(RewardsBucket rewardsBucket)
        => BuildTabs(rewardsBucket.Rewards);
}