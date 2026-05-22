using FluentAssertions;
using Sentinel.Application.Services;
using Sentinel.Domain.Models;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class TimeTrackingServiceTests
{
    [Fact]
    public void MapToDto_MapsAllFields()
    {
        Guid userId = Guid.NewGuid();
        Guid ticketId = Guid.NewGuid();
        DateOnly date = DateOnly.FromDateTime(DateTime.UtcNow);

        TimeEntry entry = new TimeEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            User = new User { FirstName = "Alice", LastName = "Doe", Email = "a@b.fr", PasswordHash = "x", Role = UserRole.Developer },
            TicketId = ticketId,
            Ticket = new Ticket { Id = ticketId, Title = "Mon ticket", CreatedById = userId, Tags = "[]" },
            Date = date,
            DurationMinutes = 90,
            Title = "Tâche",
            Description = "Détails"
        };

        var dto = TimeTrackingService.MapToDto(entry);

        dto.UserId.Should().Be(userId);
        dto.UserName.Should().Be("Alice Doe");
        dto.TicketId.Should().Be(ticketId);
        dto.TicketTitle.Should().Be("Mon ticket");
        dto.DurationMinutes.Should().Be(90);
        dto.Title.Should().Be("Tâche");
        dto.Date.Should().Be(date);
    }

}
