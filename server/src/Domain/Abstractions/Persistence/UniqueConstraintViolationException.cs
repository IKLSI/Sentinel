namespace Sentinel.Domain.Abstractions.Persistence;

public sealed class UniqueConstraintViolationException : Exception
{
    public UniqueConstraintViolationException(Exception innerException)
        : base("A unique constraint was violated by the database save", innerException)
    {
    }
}
