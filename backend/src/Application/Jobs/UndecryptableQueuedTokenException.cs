namespace Sentinel.Application.Jobs;

public sealed class UndecryptableQueuedTokenException : Exception
{
    public UndecryptableQueuedTokenException(string jobName)
        : base($"{jobName}: le jeton mis en file n'a pas pu être déchiffré. " +
               "Le job a été planifié avant le format de protection courant, ou le trousseau de clés Data Protection a changé. " +
               "L'email n'a pas été envoyé et doit être redemandé par l'utilisateur.")
    {
    }
}
