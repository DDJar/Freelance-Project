using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public class BillItemService : IBillItemService
    {
        private readonly IMongoCollection<BillItemEntity> _billItems;
        private readonly IMongoCollection<ProductEntity> _products;
        private readonly IMongoCollection<InventoryHistory> _inventoryHistories;

        public BillItemService(IOptions<MongoDbSettings> settings, IMongoClient mongoClient)
        {
            var db = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _billItems = db.GetCollection<BillItemEntity>("billItem");
            _products = db.GetCollection<ProductEntity>("product");
            _inventoryHistories = db.GetCollection<InventoryHistory>("inventory_history");
        }

        public async Task<IEnumerable<BillItemEntity>> GetAllAsync()
        {
            return await _billItems.Find(_ => true).ToListAsync();
        }

        public async Task<BillItemEntity> GetByIdAsync(string id)
        {
            return await _billItems.Find(b => b.Id == id).FirstOrDefaultAsync();
        }

        public async Task<BillItemEntity> CreateAsync(BillItemEntityRequest newBillItem)
        {
            // Lấy sản phẩm từ DB
            var product = await _products.Find(p => p.Id == newBillItem.ProductId).FirstOrDefaultAsync();
            if (product == null)
            {
                throw new ArgumentException("Sản phẩm không tồn tại");
            }

            // Kiểm tra số lượng tồn kho
            if (product.Quantity == 0)
            {
                throw new ArgumentException($"Sản phẩm '{product.Name}' hiện đã hết hàng");
            }

            if (product.Quantity < newBillItem.Quantity)
            {
                throw new ArgumentException($"Sản phẩm '{product.Name}' không đủ số lượng. Hiện có: {product.Quantity}, yêu cầu: {newBillItem.Quantity}");
            }

            // Tạo BillItem
            var billItemEntity = new BillItemEntity
            {
                Id = ObjectId.GenerateNewId().ToString(),
                BillId = string.IsNullOrWhiteSpace(newBillItem.BillId) ? null : newBillItem.BillId,
                ProductId = newBillItem.ProductId,
                Quantity = newBillItem.Quantity,
                Price = newBillItem.Price,
                Total = newBillItem.Total
            };

            // Thêm vào DB
            await _billItems.InsertOneAsync(billItemEntity);

            // Cập nhật tồn kho sản phẩm
            product.Quantity -= newBillItem.Quantity;
            var updateResult = await _products.ReplaceOneAsync(p => p.Id == product.Id, product);
            if (!updateResult.IsAcknowledged || updateResult.ModifiedCount == 0)
            {
                throw new Exception("Cập nhật số lượng sản phẩm thất bại");
            }

            // Ghi InventoryHistory
            var inventoryHistory = new InventoryHistory
            {
                ProductId = product.Id,
                QuantityChanged = -newBillItem.Quantity,
                ActionType = "Xuất kho",
                ActionDate = DateTime.UtcNow,
                IdDepartment = product.idDepartment ?? "Unknown"
            };

            await _inventoryHistories.InsertOneAsync(inventoryHistory);

            return billItemEntity;
        }





        public async Task<bool> UpdateAsync(string id, BillItemEntity updatedBillItem)
        {
            var filter = Builders<BillItemEntity>.Filter.Eq(b => b.Id, id);

            var updateBuilder = Builders<BillItemEntity>.Update;
            var updates = new List<UpdateDefinition<BillItemEntity>>
    {
        updateBuilder.Set(b => b.Quantity, updatedBillItem.Quantity),
        updateBuilder.Set(b => b.Price, updatedBillItem.Price),
        updateBuilder.Set(b => b.Total, updatedBillItem.Total),
        updateBuilder.Set(b => b.ProductId, updatedBillItem.ProductId),
        updateBuilder.Set(b => b.BillId,
            string.IsNullOrWhiteSpace(updatedBillItem.BillId) ? null : updatedBillItem.BillId)
    };

            var update = updateBuilder.Combine(updates);

            var result = await _billItems.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }


        // chỉ dùng khi xóa bill item từ card
        public async Task<bool> DeleteAsync(string id) 
        {
            
            var billItem = await _billItems.Find(b => b.Id == id).FirstOrDefaultAsync();
            if (billItem == null)
                return false;
   
            var product = await _products.Find(p => p.Id == billItem.ProductId).FirstOrDefaultAsync();
            if (product != null)
            {
                product.Quantity += billItem.Quantity;

                // Cập nhật lại sản phẩm vào DB
                var updateResult = await _products.ReplaceOneAsync(p => p.Id == product.Id, product);

                if (!updateResult.IsAcknowledged || updateResult.ModifiedCount == 0)
                    return false;

                var updateRequest = new InventoryHistory
                {
                    ProductId = product.Id,
                    QuantityChanged = +billItem.Quantity,
                    ActionType = "Hoàn kho",
                    ActionDate = DateTime.UtcNow,
                    IdDepartment = product.idDepartment ?? "Unknown"
                };
                

                await _inventoryHistories.InsertOneAsync(updateRequest);
            }
            var deleteResult = await _billItems.DeleteOneAsync(b => b.Id == id);
            return deleteResult.DeletedCount > 0;
        }

        public async Task<List<BillItemEntity>> GetByBillIdAsync(string billId)
        {
            var filter = Builders<BillItemEntity>.Filter.Eq(b => b.BillId, billId);
            return await _billItems.Find(filter).ToListAsync();
        }

        public async Task<List<(BillItemEntity Item, ProductEntity? Product)>> GetItemsWithProductByBillIdAsync(string billId)
        {
            var billItems = await GetByBillIdAsync(billId);
            var productIds = billItems.Select(b => b.ProductId).Distinct().ToList();

            var products = await _products.Find(p => productIds.Contains(p.Id)).ToListAsync();
            var productDict = products.ToDictionary(p => p.Id, p => p);

            var result = billItems.Select(item =>
            {
                productDict.TryGetValue(item.ProductId, out var product);
                return (item, product);
            }).ToList();

            return result;
        }


    }
}
