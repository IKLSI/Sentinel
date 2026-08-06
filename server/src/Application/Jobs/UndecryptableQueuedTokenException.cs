namespace Sentinel.Application.Jobs;

public sealed class UndecryptableQueuedTokenException : Exception
{
    public UndecryptableQueuedTokenException(string jobName)
        : base($"{jobName}: the queued token could not be decrypted. " +
               "The job was scheduled before the current protection format, or the Data Protection key ring has changed. " +
               "The email was not sent and must be requested again by the user.")
    {
    }
}
