using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO;

namespace API_VanHungThinh.Services.Interface
{
    public interface IDeliveryService
    {
        Task<List<Delivery>> GetAllDeliveriesAsync();
        Task<Delivery?> GetDeliveryByIdAsync(string id);
        Task<List<BillItemWithProductNameDTO>> GetItemsWithProductNameByBillIdAsync(string billId);
        Task<bool> CreateDeliveryAsync(CreateDeliveryRequest request);
        Task<bool> UpdateDeliveryAsync(string id, CreateDeliveryRequest request);
        Task<bool> DeleteDeliveryAsync(string id);
        Task<List<Delivery>> GetDeliveriesByDeliveredByAsync(string deliveredBy);
        Task<List<Delivery>> GetDeliveriesByRecipientAsync(string recipient);
        Task<List<Delivery>> GetDeliveriesByDepartmentIdAsync(string departmentId);
    }
}
