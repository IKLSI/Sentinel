using FluentAssertions;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Data;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Data;

public class AuditActionConversionTests
{
    [Theory]
    [InlineData("Login", AuditAction.Login)]
    [InlineData("SubscriptionUpdated", AuditAction.Unknown)]
    [InlineData("BillingPortalOpened", AuditAction.Unknown)]
    public void StoredAction_IsReadWithoutFailingOnObsoleteValues(string stored, AuditAction expected)
    {
        using SentinelContext context = TestDbContextFactory.CreateInMemory();

        ValueConverter converter = context.Model.FindEntityType(typeof(AuditLog))!
            .FindProperty(nameof(AuditLog.Action))!
            .GetValueConverter()!;

        converter.ConvertFromProvider(stored).Should().Be(expected);
    }
}
