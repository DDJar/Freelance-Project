using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using API_VanHungThinh.Hubs;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public class ProductPriceByCustomerTypeService : IProductPriceByCustomerTypeService


    {
        private readonly IMongoCollection<ProductPriceByCustomerTypeEntity> _priceCollection;
        private readonly INotificationService _notificationService;

        public ProductPriceByCustomerTypeService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient, INotificationService notificationService)
        {
            var database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
            _priceCollection = database.GetCollection<ProductPriceByCustomerTypeEntity>("product_price_by_customer_type");
            _notificationService = notificationService;
        }

        public async Task<List<ProductPriceByCustomerTypeEntity>> GetPricesByProductIdAsync(string productId)
        {
            // Projection: chỉ lấy trường cần thiết
            var projection = Builders<ProductPriceByCustomerTypeEntity>.Projection
                .Include(p => p.ProductId)
                .Include(p => p.CustomerType)
                .Include(p => p.Price)
                .Include(p => p.UpdatedAt)
                .Include(p => p.CreatedAt);
            var result = await _priceCollection.Find(p => p.ProductId == productId)
                .Project<ProductPriceByCustomerTypeEntity>(projection)
                .ToListAsync();
            return result;
        }

        public async Task<List<ProductPriceByCustomerTypeEntity>> GetPricesAsync(IEnumerable<string> productIds, string customerType)
        {
            var ids = productIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct()
                .ToList();

            if (!ids.Any() || string.IsNullOrWhiteSpace(customerType))
            {
                return new List<ProductPriceByCustomerTypeEntity>();
            }

            var projection = Builders<ProductPriceByCustomerTypeEntity>.Projection
                .Include(p => p.ProductId)
                .Include(p => p.CustomerType)
                .Include(p => p.Price);

            return await _priceCollection
                .Find(p => ids.Contains(p.ProductId) && p.CustomerType == customerType)
                .Project<ProductPriceByCustomerTypeEntity>(projection)
                .ToListAsync();
        }

        public async Task<ProductPriceByCustomerTypeEntity?> GetPriceAsync(string productId, string customerType)
        {
            // Projection: chỉ lấy trường cần thiết
            var projection = Builders<ProductPriceByCustomerTypeEntity>.Projection
                .Include(p => p.ProductId)
                .Include(p => p.CustomerType)
                .Include(p => p.Price)
                .Include(p => p.UpdatedAt)
                .Include(p => p.CreatedAt);
            return await _priceCollection.Find(p => p.ProductId == productId && p.CustomerType == customerType)
                .Project<ProductPriceByCustomerTypeEntity>(projection)
                .FirstOrDefaultAsync();
        }

        public async Task CreateOrUpdatePriceAsync(ProductPriceByCustomerTypeEntity price)
        {
            var filter = Builders<ProductPriceByCustomerTypeEntity>.Filter.Where(p => p.ProductId == price.ProductId && p.CustomerType == price.CustomerType);
            var now = DateTime.UtcNow;
            var update = Builders<ProductPriceByCustomerTypeEntity>.Update
                .Set(p => p.Price, price.Price)
                .Set(p => p.UpdatedAt, now)
                .SetOnInsert(p => p.CreatedAt, now);

            var result = await _priceCollection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true });

            // If an upsert happened, UpsertedId will be set
            if (result.UpsertedId != null)
            {
                var upsertedId = result.UpsertedId.AsObjectId.ToString();
                await _notificationService.NotifyCreated(EntityType.ProductPriceByCustomerType, upsertedId, price);
                return;
            }

            // Otherwise it's an update — fetch the updated document to get its Id
            var updated = await _priceCollection.Find(filter).FirstOrDefaultAsync();
            if (updated != null)
            {
                await _notificationService.NotifyUpdated(EntityType.ProductPriceByCustomerType, updated.Id ?? string.Empty, updated);
            }
        }

        public async Task DeletePriceAsync(string productId, string customerType)
        {
            var filter = Builders<ProductPriceByCustomerTypeEntity>.Filter.Where(p => p.ProductId == productId && p.CustomerType == customerType);
            var toDelete = await _priceCollection.Find(filter).FirstOrDefaultAsync();
            if (toDelete != null)
            {
                await _priceCollection.DeleteOneAsync(filter);
                await _notificationService.NotifyDeleted(EntityType.ProductPriceByCustomerType, toDelete.Id ?? string.Empty);
            }
        }

        public async Task<List<string>> GetAllCustomerTypesAsync()
        {
            // Chỉ lấy trường CustomerType
            var all = await _priceCollection.DistinctAsync<string>("CustomerType", Builders<ProductPriceByCustomerTypeEntity>.Filter.Ne(x => x.CustomerType, null));
            return all.ToList();
        }
        // Gợi ý: Đảm bảo đã tạo index trên ProductId và CustomerType trong MongoDB để truy vấn nhanh
        // db.product_price_by_customer_type.createIndex({ ProductId: 1 })
        // db.product_price_by_customer_type.createIndex({ ProductId: 1, CustomerType: 1 })
    }
}
