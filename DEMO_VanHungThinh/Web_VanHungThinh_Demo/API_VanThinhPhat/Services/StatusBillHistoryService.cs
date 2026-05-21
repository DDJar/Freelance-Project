using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public class StatusBillHistoryService : IStatusBillHistoryService
    {
        private readonly IMongoCollection<StatusBillHistory> _statusBillHistories;

        public StatusBillHistoryService(
            IOptions<MongoDbSettings> settings,
            IMongoClient mongoClient)
        {
            var db = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _statusBillHistories = db.GetCollection<StatusBillHistory>("status_bill_history");
        }

        public async Task<bool> RecordStatusChangeAsync(string billId, string previousStatus, string newStatus, string? address = null, string? changedBy = null)
        {
            if (string.IsNullOrWhiteSpace(billId) || string.IsNullOrWhiteSpace(newStatus))
                return false;

            var history = new StatusBillHistory
            {
                BillId = billId,
                PreviousStatus = previousStatus,
                NewStatus = newStatus,
                Address = address,
                ChangedBy = changedBy ?? "System",
                ChangedAt = DateTime.UtcNow
            };

            try
            {
                await _statusBillHistories.InsertOneAsync(history);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<StatusBillHistory>> GetBillStatusHistoryAsync(string billId)
        {
            if (string.IsNullOrWhiteSpace(billId))
                return new List<StatusBillHistory>();

            var histories = await _statusBillHistories
                .Find(h => h.BillId == billId)
                .SortByDescending(h => h.ChangedAt)
                .ToListAsync();

            return histories;
        }

        public async Task<bool> DeleteBillStatusHistoryAsync(string billId)
        {
            if (string.IsNullOrWhiteSpace(billId))
                return false;

            var result = await _statusBillHistories.DeleteManyAsync(h => h.BillId == billId);
            return result.DeletedCount > 0;
        }
    }
}
