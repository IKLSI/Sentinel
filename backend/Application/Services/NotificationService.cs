using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

public interface INotificationService
{
    Task CreateAsync(Guid userId, Guid organizationId, NotificationType type, string message, Guid? ticketId = null);
    Task<List<Notification>> GetForUserAsync(Guid userId, int limit = 30);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkReadAsync(Guid notificationId, Guid userId);
    Task MarkAllReadAsync(Guid userId);
}

public class NotificationService : INotificationService
{
    private readonly SentinelContext _context;
    private readonly INotificationPusher? _pusher;

    public NotificationService(SentinelContext context, INotificationPusher? pusher = null)
    {
        _context = context;
        _pusher = pusher;
    }

    public async Task CreateAsync(Guid userId, Guid organizationId, NotificationType type, string message, Guid? ticketId = null)
    {
        Notification notification = new Notification
        {
            UserId = userId,
            OrganizationId = organizationId,
            Type = type,
            Message = message,
            TicketId = ticketId
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        if (_pusher is not null)
            await _pusher.PushAsync(userId, type, message, ticketId, notification.Id, notification.CreatedAt);
    }

    public async Task<List<Notification>> GetForUserAsync(Guid userId, int limit = 30)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }

    public async Task MarkReadAsync(Guid notificationId, Guid userId)
    {
        Notification? notif = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notif is null) return;

        notif.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }
}
