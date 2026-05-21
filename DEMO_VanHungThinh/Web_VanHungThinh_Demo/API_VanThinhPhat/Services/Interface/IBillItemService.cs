using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface IBillItemService
    {
        Task<IEnumerable<BillItemEntity>> GetAllAsync();
        Task<BillItemEntity> GetByIdAsync(string id);
        Task<BillItemEntity> CreateAsync(BillItemEntityRequest newBillItem);
        Task<bool> UpdateAsync(string id, BillItemEntity updatedBillItem);
        Task<bool> DeleteAsync(string id);
        Task<List<BillItemEntity>> GetByBillIdAsync(string billId);
        Task<List<(BillItemEntity Item, ProductEntity? Product)>> GetItemsWithProductByBillIdAsync(string billId);

    }
}
