using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface IProductService
    {
        Task<List<ProductEntity>> GetAsync();
        Task<(List<ProductEntity>, long)> GetAsync(int page, int pageSize);
        Task<ProductEntity?> GetAsync(string id);
        Task CreateAsync(ProductEntity product);
        Task UpdateAsync(string id, ProductEntity product);
        Task DeleteAsync(string id);
        Task<List<ProductEntity>> GetSearchAsync(string? id_department,string? name,string? category);
        Task<(List<ProductEntity>, long)> GetPagedAsync(
            int page,
            int pageSize,
            string? search,
            IEnumerable<string>? categories,
            IEnumerable<string>? brands,
            IEnumerable<string>? status,
            double? maxPrice,
            string? sort);
        Task<List<CategoryCountResult>> GetCategoriesWithCountsAsync();
        Task<List<BrandCountResult>> GetBrandsWithCountsAsync();
        Task<List<StatusCountResult>> GetStatusesWithCountsAsync();
        Task<bool> UpdateInventoryAndLogAsync(string productId, int quantityChanged);
        Task<List<InventoryHistory>> GetInventoryHistoryByProductIdAsync(string productId);
        Task<List<InventoryReportResult>> GetInventoryReportAsync(InventoryReportFilter filter);
    }
}
