using FluentAssertions;
using Sentinel.Application.Audit;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class AuditLogQueueTests
{
    private const int Capacity = 10_000;

    [Fact]
    public void Enqueue_QuandLaFileEstSaturee_CompteLesEntreesRejetees()
    {
        AuditLogQueue sut = new AuditLogQueue();

        for (int index = 0; index < Capacity; index++)
            sut.Enqueue(NewLog());

        sut.ReadAndResetDroppedCount().Should().Be(0);

        sut.Enqueue(NewLog());
        sut.Enqueue(NewLog());

        sut.ReadAndResetDroppedCount().Should().Be(2);
    }

    [Fact]
    public void ReadAndResetDroppedCount_ApresLecture_RepartDeZero()
    {
        AuditLogQueue sut = new AuditLogQueue();

        for (int index = 0; index < Capacity + 1; index++)
            sut.Enqueue(NewLog());

        sut.ReadAndResetDroppedCount().Should().Be(1);
        sut.ReadAndResetDroppedCount().Should().Be(0);
    }

    [Fact]
    public void Enqueue_QuandLaFileNEstPasPleine_NeRejetteRien()
    {
        AuditLogQueue sut = new AuditLogQueue();

        sut.Enqueue(NewLog());

        sut.Reader.TryRead(out AuditLog? read).Should().BeTrue();
        read.Should().NotBeNull();
        sut.ReadAndResetDroppedCount().Should().Be(0);
    }

    private static AuditLog NewLog() => new()
    {
        Action = AuditAction.UserUpdated,
        EntityType = "User",
        CreatedAt = DateTime.UtcNow
    };
}
