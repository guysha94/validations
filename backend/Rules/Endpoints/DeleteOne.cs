namespace Backend.Rules.Endpoints;

public class DeleteOne(IRuleRepository repo) : EndpointWithoutRequest<object>
{
    public override void Configure()
    {
        Delete("rules/{id}");
        AllowAnonymous();
        Tags("Rules");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(id))
        {
            await Send.ErrorsAsync(StatusCodes.Status400BadRequest, ct);
            return;
        }

        var deleted = await repo.DeleteOneAsync(id, ct);
        await Send.OkAsync(new { deleted }, ct);
    }
}