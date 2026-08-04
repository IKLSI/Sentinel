using Microsoft.AspNetCore.Authorization;
using Sentinel.Domain.Entities;

namespace Sentinel.API.Attributes;

public sealed class AuthorizeRolesAttribute : AuthorizeAttribute
{
    public AuthorizeRolesAttribute(params UserRole[] roles)
    {
        Roles = string.Join(",", roles.Select(r => r.ToString()));
    }
}
