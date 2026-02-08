using Event = Backend.Events.Event;

namespace Backend.Abstractions;

public interface IEventRepository : IRepository<Event, Guid, EventCreateDto, EventUpdateDto>
{
    ValueTask<Event> GetByEventTypeAsync(string eventType, CancellationToken ct = default);

    ValueTask<Event?> UpdateSchemaAsync(Guid id, IDictionary<string, ICollection<EventColumn>> schema,
        CancellationToken ct = default);
}