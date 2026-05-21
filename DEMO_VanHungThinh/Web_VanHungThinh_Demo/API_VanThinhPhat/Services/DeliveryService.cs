using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
namespace API_VanHungThinh.Services
{
    public class DeliveryService : IDeliveryService
    {
        private readonly IMongoCollection<Delivery> _deliveries;
        private readonly IMongoCollection<BillItemEntity> _billItems;
        private readonly IMongoCollection<BillEntity> _bills;
        private readonly IMongoCollection<ProductEntity> _products;
        public DeliveryService(IOptions<MongoDbSettings> settings, IMongoClient mongoClient)
        {
            var db = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _deliveries = db.GetCollection<Delivery>("delivery");
            _billItems = db.GetCollection<BillItemEntity>("billItem");
            _bills = db.GetCollection<BillEntity>("bill");
            _products = db.GetCollection<ProductEntity>("product");
        }

        public async Task<List<Delivery>> GetAllDeliveriesAsync() =>
            await _deliveries.Find(_ => true).ToListAsync();

        public async Task<Delivery?> GetDeliveryByIdAsync(string id) =>
            await _deliveries.Find(d => d.Id == id).FirstOrDefaultAsync();

        // Lấy danh sách sản phẩm trong hóa đơn
        public async Task<List<BillItemWithProductNameDTO>> GetItemsWithProductNameByBillIdAsync(string billId)
        {
            var billItems = await _billItems.Find(item => item.BillId == billId).ToListAsync();
            var productIds = billItems.Select(b => b.ProductId).ToList();

            var products = await _products.Find(p => productIds.Contains(p.Id)).ToListAsync();

            var result = billItems.Select(item => new BillItemWithProductNameDTO
            {
                ProductId = item.ProductId,
                ProductName = products.FirstOrDefault(p => p.Id == item.ProductId)?.Name ?? "Unknown",
                Quantity = item.Quantity,
                Price = item.Price,
                Total = item.Total
            }).ToList();

            return result;
        }


        public async Task<bool> CreateDeliveryAsync(CreateDeliveryRequest request)
        {
            var delivery = new Delivery
            {
                BillId = request.BillId,
                DeliveryDate = request.DeliveryDate,
                DeliveredBy = request.DeliveredBy,
                Recipient = request.Recipient,
                Status = request.Status,
                Notes = request.Notes
            };

            await _deliveries.InsertOneAsync(delivery);
            return true;
        }

        public async Task<bool> UpdateDeliveryAsync(string id, CreateDeliveryRequest request)
        {
            var update = Builders<Delivery>.Update
                .Set(d => d.DeliveryDate, request.DeliveryDate)
                .Set(d => d.DeliveredBy, request.DeliveredBy)
                .Set(d => d.Recipient, request.Recipient)
                .Set(d => d.Status, request.Status)
                .Set(d => d.Notes, request.Notes);

            var result = await _deliveries.UpdateOneAsync(d => d.Id == id, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteDeliveryAsync(string id)
        {
            var result = await _deliveries.DeleteOneAsync(d => d.Id == id);
            return result.DeletedCount > 0;
        }
        public async Task<List<Delivery>> GetDeliveriesByDeliveredByAsync(string deliveredBy)
        {
            return await _deliveries
                .Find(d => d.DeliveredBy.ToLower() == deliveredBy.ToLower())
                .SortByDescending(d => d.DeliveryDate)
                .ToListAsync();
        }

        public async Task<List<Delivery>> GetDeliveriesByRecipientAsync(string recipient)
        {
            return await _deliveries
                .Find(d => d.Recipient.ToLower() == recipient.ToLower())
                .SortByDescending(d => d.DeliveryDate)
                .ToListAsync();
        }

        public async Task<List<Delivery>> GetDeliveriesByDepartmentIdAsync(string departmentId)
        {
            if (string.IsNullOrEmpty(departmentId))
                return new List<Delivery>();

            // Bước 1: Lấy danh sách productId thuộc department
            var productIds = await _products
                .Find(p => p.idDepartment == departmentId)
                .Project(p => p.Id)
                .ToListAsync();

            if (!productIds.Any())
                return new List<Delivery>();

            var billItems = await _billItems
                .Find(bi => productIds.Contains(bi.ProductId))
                .ToListAsync();

            if (!billItems.Any())
                return new List<Delivery>();

            var billIds = billItems
                .Where(bi => !string.IsNullOrEmpty(bi.BillId))
                .Select(bi => bi.BillId)
                .Distinct()
                .ToList();

            var deliveries = await _deliveries
                .Find(item => billIds.Contains(item.BillId.ToString()))
                .ToListAsync();

            return deliveries;
        }

    }
}
