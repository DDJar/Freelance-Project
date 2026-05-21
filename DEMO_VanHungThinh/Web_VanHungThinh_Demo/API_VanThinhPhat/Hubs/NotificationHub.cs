using Microsoft.AspNetCore.SignalR;

namespace API_VanHungThinh.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time notifications when data changes (CRUD operations)
    /// </summary>
    public class NotificationHub : Hub
    {
        /// <summary>
        /// Called when a client connects
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            Console.WriteLine($"Client connected: {Context.ConnectionId}");
        }

        /// <summary>
        /// Called when a client disconnects
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
            Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
        }

        /// <summary>
        /// Join a specific group to receive notifications for a specific entity type
        /// </summary>
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"Client {Context.ConnectionId} joined group: {groupName}");
        }

        /// <summary>
        /// Leave a specific group
        /// </summary>
        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"Client {Context.ConnectionId} left group: {groupName}");
        }
    }

    /// <summary>
    /// Entity types for SignalR notifications
    /// </summary>
    public static class EntityType
    {
        public const string Bill = "Bill";
        public const string Product = "Product";
        public const string Customer = "Customer";
        public const string User = "User";
        public const string Blog = "Blog";
        public const string Department = "Department";
        public const string Delivery = "Delivery";
        public const string Task = "Task";
        // Added for product price notifications
        public const string ProductPriceByCustomerType = "ProductPriceByCustomerType";
    }

    /// <summary>
    /// Action types for CRUD operations
    /// </summary>
    public static class ActionType
    {
        public const string Created = "Created";
        public const string Updated = "Updated";
        public const string Deleted = "Deleted";
    }

    /// <summary>
    /// Notification payload sent to clients
    /// </summary>
    public class DataChangeNotification
    {
        public string EntityType { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public object? Data { get; set; }
        public string? Message { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? UserId { get; set; }
        public string? UserName { get; set; }
    }
}
