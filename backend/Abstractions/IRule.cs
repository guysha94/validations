namespace Backend.Abstractions;

public interface IRule
{
    string Id { get; set; }
    string EventId { get; set; }
    string Name { get; set; }
    string ErrorMessage { get; set; }
}