namespace Sentinel.Domain.Abstractions.Persistence;

public sealed class PersistenceException : Exception
{
    public PersistenceException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
