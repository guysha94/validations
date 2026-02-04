namespace Backend.Users;

[Table("users")]
public record User
{
    [Column(name: "id")] public Guid Id { get; set; } = Guid.CreateVersion7();

    [Column(name: "email")] public string Email { get; set; } = string.Empty;

    [Column(name: "password")] public string Password { get; set; } = string.Empty;

    [Column(name: "disabled")] public bool Disabled { get; set; }

    [Column(name: "updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [NotMapped] [JsonInclude] public DateTimeOffset CreateAt => Id.CreationTime();
}