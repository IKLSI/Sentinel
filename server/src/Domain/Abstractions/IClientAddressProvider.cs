namespace Sentinel.Domain.Abstractions;

public interface IClientAddressProvider
{
    string Current { get; }
}
