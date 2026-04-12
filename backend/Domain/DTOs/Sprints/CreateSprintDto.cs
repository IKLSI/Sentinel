using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Sprints;

public class CreateSprintDto
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Goal { get; set; }

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }
}
