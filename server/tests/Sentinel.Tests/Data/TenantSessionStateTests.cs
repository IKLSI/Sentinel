using System.Data;
using System.Data.Common;
using FluentAssertions;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Tests.Data;

public class TenantSessionStateTests
{
    private const string Organization = "org-a";

    private sealed class FakeTransaction : DbTransaction
    {
        public override IsolationLevel IsolationLevel => IsolationLevel.ReadCommitted;
        protected override DbConnection? DbConnection => null;
        public override void Commit() { }
        public override void Rollback() { }
    }

    [Fact]
    public void IsApplied_QuandAppliqueHorsTransaction_ResteValideDansUneTransactionUlterieure()
    {
        TenantSessionState state = new TenantSessionState();

        state.MarkApplied(Organization, null);

        state.IsApplied(Organization, new FakeTransaction()).Should().BeTrue();
    }

    [Fact]
    public void IsApplied_QuandAppliqueDansUneTransactionNonValidee_ExigeUnNouveauSetHorsDeCetteTransaction()
    {
        TenantSessionState state = new TenantSessionState();
        FakeTransaction transaction = new FakeTransaction();

        state.MarkApplied(Organization, transaction);

        state.IsApplied(Organization, transaction).Should().BeTrue();
        state.IsApplied(Organization, null).Should().BeFalse();
    }

    [Fact]
    public void IsApplied_QuandLaTransactionEstValidee_ResteValideEnsuite()
    {
        TenantSessionState state = new TenantSessionState();
        FakeTransaction transaction = new FakeTransaction();

        state.MarkApplied(Organization, transaction);
        state.MarkCommitted(transaction);

        state.IsApplied(Organization, null).Should().BeTrue();
    }

    [Fact]
    public void InvalidateIfUncommitted_QuandUneTransactionNonValideeEstEnCours_Invalide()
    {
        TenantSessionState state = new TenantSessionState();
        FakeTransaction transaction = new FakeTransaction();

        state.MarkApplied(Organization, transaction);
        state.InvalidateIfUncommitted();

        state.IsApplied(Organization, transaction).Should().BeFalse();
    }

    [Fact]
    public void InvalidateIfUncommitted_QuandAppliqueHorsTransaction_ConserveLEtat()
    {
        TenantSessionState state = new TenantSessionState();

        state.MarkApplied(Organization, null);
        state.InvalidateIfUncommitted();

        state.IsApplied(Organization, null).Should().BeTrue();
    }
}
