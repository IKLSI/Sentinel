using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets.Create;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.Tests.Services;

public class TicketCreateValidatorTests
{
    private readonly TicketCreateValidator _sut = new();

    [Fact]
    public async Task ValidateAsync_WhenModelIsValid_ReturnsSuccess()
    {
        CreateTicketDto model = NewModel();

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateAsync_WhenTitleIsEmpty_ReturnsInvalid()
    {
        CreateTicketDto model = NewModel();
        model.Title = "   ";

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.Status.Should().Be(ResultStatus.Invalid);
        result.ValidationErrors.Should().Contain(error => error.Code == ValidationCodes.TicketTitleRequired);
    }

    [Fact]
    public async Task ValidateAsync_WhenEstimatedHoursExceedsMaximum_ReturnsInvalid()
    {
        CreateTicketDto model = NewModel();
        model.EstimatedHours = 10001;

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.ValidationErrors.Should().Contain(error => error.Code == ValidationCodes.TicketEstimatedHoursMax);
    }

    private static CreateTicketDto NewModel() => new()
    {
        Title = "Ticket valide",
        Description = "Description",
        Priority = TicketPriority.Medium,
        Type = TicketType.Bug
    };
}
