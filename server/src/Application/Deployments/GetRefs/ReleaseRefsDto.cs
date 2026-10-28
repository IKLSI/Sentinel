namespace Sentinel.Application.Deployments.GetRefs;

public class ReleaseRefsDto
{
    public bool Available { get; set; }
    public List<string> Tags { get; set; } = [];
    public List<string> Branches { get; set; } = [];
    public string? SuggestedBase { get; set; }
    public string? SuggestedHead { get; set; }
}
