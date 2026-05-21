using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace API_VanHungThinh.Services
{
    /// <summary>
    /// Interface for sending real-time notifications
    /// </summary>
    public interface INotificationService
    {
        Task NotifyDataChanged(string entityType, string action, string entityId, object? data = null, string? message = null, string? userId = null, string? userName = null);
        Task NotifyCreated(string entityType, string entityId, object? data = null, string? userId = null, string? userName = null);
        Task NotifyUpdated(string entityType, string entityId, object? data = null, string? userId = null, string? userName = null);
        Task NotifyDeleted(string entityType, string entityId, string? userId = null, string? userName = null);
    }

    /// <summary>
    /// Service for sending real-time notifications via SignalR
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        /// <summary>
        /// Send a data change notification to all connected clients
        /// </summary>
        public async Task NotifyDataChanged(string entityType, string action, string entityId, object? data = null, string? message = null, string? userId = null, string? userName = null)
        {
            var notification = new DataChangeNotification
            {
                EntityType = entityType,
                Action = action,
                EntityId = entityId,
                Data = data,
                Message = message ?? $"{entityType} {action.ToLower()}",
                Timestamp = DateTime.UtcNow,
                UserId = userId,
                UserName = userName
            };

            // Send to all clients
            await _hubContext.Clients.All.SendAsync("DataChanged", notification);

            // Also send to specific entity group
            await _hubContext.Clients.Group(entityType).SendAsync("DataChanged", notification);
        }

        /// <summary>
        /// Notify that an entity was created
        /// </summary>
        public async Task NotifyCreated(string entityType, string entityId, object? data = null, string? userId = null, string? userName = null)
        {
            await NotifyDataChanged(entityType, ActionType.Created, entityId, data, $"{entityType} mới được tạo", userId, userName);
        }

        /// <summary>
        /// Notify that an entity was updated
        /// </summary>
        public async Task NotifyUpdated(string entityType, string entityId, object? data = null, string? userId = null, string? userName = null)
        {
            await NotifyDataChanged(entityType, ActionType.Updated, entityId, data, $"{entityType} đã được cập nhật", userId, userName);
        }

        /// <summary>
        /// Notify that an entity was deleted
        /// </summary>
        public async Task NotifyDeleted(string entityType, string entityId, string? userId = null, string? userName = null)
        {
            await NotifyDataChanged(entityType, ActionType.Deleted, entityId, null, $"{entityType} đã bị xóa", userId, userName);
        }
    }
}
