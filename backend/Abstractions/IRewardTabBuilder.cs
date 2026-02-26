using System.Data;
using RewardStringParser.RewardModels;

namespace Backend.Abstractions;

public interface IRewardTabBuilder
{
    IReadOnlyDictionary<string, DataTable> BuildTabs(IEnumerable<IReward> rewards);
    IReadOnlyDictionary<string, DataTable> BuildTabs(params IReward[] rewards);
    IReadOnlyDictionary<string, DataTable> BuildTabs(RewardsBucket rewardsBucket);
}