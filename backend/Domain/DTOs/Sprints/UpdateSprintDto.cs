using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Sprints;

public class UpdateSprintDto
{
    [MaxLength(200)]
    public string? Name { get; set; }

    public string? Goal { get; set; }

    public string? Status { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }
}
