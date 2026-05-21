using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface IProductPriceByCustomerTypeService
    {
        Task<List<string>> GetAllCustomerTypesAsync();
        Task<List<ProductPriceByCustomerTypeEntity>> GetPricesByProductIdAsync(string productId);
        Task<List<ProductPriceByCustomerTypeEntity>> GetPricesAsync(IEnumerable<string> productIds, string customerType);
        Task<ProductPriceByCustomerTypeEntity?> GetPriceAsync(string productId, string customerType);
        Task CreateOrUpdatePriceAsync(ProductPriceByCustomerTypeEntity price);
        Task DeletePriceAsync(string productId, string customerType);
    }
}
