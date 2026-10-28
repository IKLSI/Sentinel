using Sentinel.Domain.Git;

namespace Sentinel.Domain.Abstractions;

public sealed record RepositoryListing(
    bool Success,
    int? StatusCode,
    List<(string Name, string Url)> Repos,
    bool Truncated);

public sealed record RepositoryBranchListing(string? DefaultBranch, List<string> Branches, bool Truncated);

public sealed record RepositoryFileListing(List<(string Name, string Url, string Path)> Files, bool Truncated);

public sealed record RepositoryCommit(string Message, DateTime? Date);

public enum RepositoryFileChange
{
    Added,
    Modified,
    Removed,
    Renamed
}

public sealed record RepositoryChangedFile(string Path, RepositoryFileChange Change);

public sealed record RepositoryComparison(
    List<RepositoryCommit> Commits,
    List<RepositoryChangedFile> Files,
    bool Truncated);

public interface IRepositoryHostClient
{
    Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform, GitLabInstance gitLab,
        CancellationToken cancellationToken);

    Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform,
        GitLabInstance gitLab, CancellationToken cancellationToken);

    Task<string?> GetHeadCommitAsync(string host, string owner, string repo, RepositoryAccess? access,
        string? branch, CancellationToken cancellationToken);

    Task<RepositoryBranchListing?> ListBranchesAsync(string host, string owner, string repo,
        RepositoryAccess? access, CancellationToken cancellationToken);

    Task<List<string>?> ListTagsAsync(string host, string owner, string repo, RepositoryAccess? access,
        CancellationToken cancellationToken);

    Task<RepositoryComparison?> CompareAsync(string host, string owner, string repo, RepositoryAccess? access,
        string baseReference, string headReference, CancellationToken cancellationToken);

    Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
        RepositoryAccess? access, string? commitSha, CancellationToken cancellationToken);

    string? FileUrl(string host, string owner, string repo, RepositoryAccess? access, string path,
        string reference);

    Task<string?> FetchTextAsync(string host, string url, RepositoryAccess? access,
        CancellationToken cancellationToken);

    Task<string?> FindMergeRequestUrlAsync(string host, string owner, string repo, RepositoryAccess access,
        string sourceBranch, CancellationToken cancellationToken);
}
