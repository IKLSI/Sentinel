using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Infrastructure.Repositories;

public class StripeWebhookEventLogRepository(SentinelContext context)
    : CrudEntityWithIdRepository<StripeWebhookEventLog>(context), IStripeWebhookEventLogRepository;
