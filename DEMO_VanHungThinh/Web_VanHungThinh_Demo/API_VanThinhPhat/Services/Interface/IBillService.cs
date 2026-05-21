using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO;

namespace API_VanHungThinh.Services.Interface
{
    public interface IBillService
    {
        Task<BillEntity?> CreateBillOnlyAsync(CreateBillRequest request);
        Task<List<BillWithItemsDTO>> GetAllBillsAsync();
        Task<(List<BillWithItemsDTO>, long)> GetAllBillsAsync(int page, int pageSize);
        Task<BillEntity?> GetBillByIdAsync(string billId);
        Task<BillDetailsDTO?> GetBillDetailsAsync(string billId);
        Task<List<BillItemEntity>> GetBillItemsAsync(string billId);
        Task<bool> UpdateBillItemsAsync(string billId, List<CreateBillItemRequest> items);
        Task<bool> UpdateBillAsync(string billId, UpdateBillRequest request);
        Task<List<BillEntity>> SearchBillsAsync(
        double? minTotalAmount,
        double? maxTotalAmount,
        string? timeRange,
        string? paymentMethod,
        string? status);
        Task<bool> UpdateBillStatusAsync(string billId, string newStatus,string newAddress);
        Task<bool> DeleteBillAsync(string billId, bool restoreInventory);
        Task<List<BillWithItemsDTO>> GetBillsByDepartmentAsync(string? departmentId);
        Task<BillWithItemsDTO?> LookupBillAsync(string email, string billId);
        Task<BillWithItemsDTO> CreateBillWithItemsAsync(CreateBillRequest request);
        Task<int> FixMissingInvoiceNumbersAsync();

    }
}
