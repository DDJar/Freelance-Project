using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface IStatusBillHistoryService
    {
        Task<bool> RecordStatusChangeAsync(string billId, string previousStatus, string newStatus, string? address = null, string? changedBy = null);
        Task<List<StatusBillHistory>> GetBillStatusHistoryAsync(string billId);
        Task<bool> DeleteBillStatusHistoryAsync(string billId);
    }
}
