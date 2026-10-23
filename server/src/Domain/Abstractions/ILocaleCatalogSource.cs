namespace Sentinel.Domain.Abstractions;

public interface ILocaleCatalogSource
{
    Task<byte[]?> ReadAsync(string culture, CancellationToken cancellationToken);
}
