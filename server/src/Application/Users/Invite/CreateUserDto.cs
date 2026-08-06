namespace Sentinel.Application.Users.Invite;

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Developer";
}
