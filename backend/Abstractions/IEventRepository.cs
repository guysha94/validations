namespace Backend.Abstractions;

public interface IEventRepository : IRepository<Event, Guid, EventCreateDto, EventUpdateDto>
{
    ValueTask<Event> GetByEventTypeAsync(Guid eventType, CancellationToken ct = default);

    ValueTask<Event?> UpdateSchemaAsync(Guid id, IDictionary<string, ICollection<EventColumn>> schema,
        CancellationToken ct = default);
}