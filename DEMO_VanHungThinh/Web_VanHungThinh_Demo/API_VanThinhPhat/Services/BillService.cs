using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public class BillService : IBillService
    {
        private readonly IMongoCollection<BillEntity> _bills;
        private readonly IMongoCollection<BillItemEntity> _billItems;
        private readonly IMongoCollection<ProductEntity> _products;
        private readonly IMongoCollection<InventoryHistory> _inventoryHistories;
        private readonly IProductPriceByCustomerTypeService _productPriceByCustomerTypeService;
        private readonly IStatusBillHistoryService _statusBillHistoryService;

        public BillService(
            IOptions<MongoDbSettings> settings,
            IMongoClient mongoClient,
            IProductPriceByCustomerTypeService productPriceByCustomerTypeService,
            IStatusBillHistoryService statusBillHistoryService)
        {
            var db = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _bills = db.GetCollection<BillEntity>("bill");
            _billItems = db.GetCollection<BillItemEntity>("billItem");
            _products = db.GetCollection<ProductEntity>("product");
            _inventoryHistories = db.GetCollection<InventoryHistory>("inventory_history");
            _productPriceByCustomerTypeService = productPriceByCustomerTypeService;
            _statusBillHistoryService = statusBillHistoryService;
        }
        public async Task<BillWithItemsDTO> CreateBillWithItemsAsync(CreateBillRequest request)
        {
            if (request.Items == null || !request.Items.Any())
                throw new ArgumentException("Hóa đơn phải có ít nhất một sản phẩm.");

            using var session = await _bills.Database.Client.StartSessionAsync();
            session.StartTransaction();

            try
            {
                // Tạo bill
                var billDate = DateTime.UtcNow;
                var bill = new BillEntity
                {
                    IdentifyNumber = request.IdentifyNumber,
                    InvoiceNumber = string.IsNullOrWhiteSpace(request.InvoiceNumber) ? GenerateInvoiceNumber(billDate) : request.InvoiceNumber,
                    PaymentMethod = request.PaymentMethod,
                    Notes = request.Notes,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    TotalAmount = request.TotalAmount,
                    DateOfBirth = request.DateOfBirth,
                    Status = request.Status,
                    Phone = request.Phone,
                    Address = request.Address,
                    BillDate = billDate
                };

                await _bills.InsertOneAsync(session, bill);

                double itemsTotalAmount = 0;
                var itemsWithProductInfo = new List<ShoppingCartItemDTO2>();

                foreach (var item in request.Items)
                {
                    if (string.IsNullOrWhiteSpace(item.ProductId))
                        throw new ArgumentException("Sản phẩm không hợp lệ.");

                    if (item.Quantity <= 0)
                        throw new ArgumentException("Số lượng sản phẩm phải lớn hơn 0.");

                    var product = await _products
                        .Find(session, p => p.Id == item.ProductId)
                        .FirstOrDefaultAsync();

                    if (product == null)
                        throw new ArgumentException($"Sản phẩm {item.ProductId} không tồn tại.");

                    double price = item.Price > 0 ? item.Price : product.Price;
                    if (item.Price <= 0 && !string.IsNullOrEmpty(request.CustomerType) && !string.IsNullOrEmpty(product.Id))
                    {
                        var priceByType = await _productPriceByCustomerTypeService.GetPriceAsync(product.Id, request.CustomerType);
                        if (priceByType != null)
                        {
                            price = priceByType.Price;
                        }
                    }

                    var productFilter = Builders<ProductEntity>.Filter.Eq(p => p.Id, item.ProductId) &
                                        Builders<ProductEntity>.Filter.Gte(p => p.Quantity, item.Quantity);
                    var productUpdate = Builders<ProductEntity>.Update
                        .Inc(p => p.Quantity, -item.Quantity)
                        .Set(p => p.UpdatedAt, DateTime.UtcNow);

                    var stockUpdateOptions = new FindOneAndUpdateOptions<ProductEntity>
                    {
                        ReturnDocument = ReturnDocument.After
                    };

                    var updatedProduct = await _products.FindOneAndUpdateAsync(
                        session,
                        productFilter,
                        productUpdate,
                        stockUpdateOptions);

                    if (updatedProduct == null)
                        throw new ArgumentException($"Sản phẩm '{product.Name}' không đủ số lượng. Hiện có: {product.Quantity}, yêu cầu: {item.Quantity}");

                    double itemTotal = item.Total > 0 ? item.Total : item.Quantity * price;

                    var billItem = new BillItemEntity
                    {
                        BillId = bill.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = price,
                        Total = itemTotal
                    };

                    await _billItems.InsertOneAsync(session, billItem);
                    itemsTotalAmount += itemTotal;

                    var inventoryHistory = new InventoryHistory
                    {
                        ProductId = product.Id ?? string.Empty,
                        QuantityChanged = -item.Quantity,
                        ActionType = "Xuất kho",
                        ActionDate = DateTime.UtcNow,
                        IdDepartment = product.idDepartment ?? string.Empty
                    };

                    await _inventoryHistories.InsertOneAsync(session, inventoryHistory);

                    itemsWithProductInfo.Add(new ShoppingCartItemDTO2
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Price = price,
                        Total = itemTotal
                    });
                }

                bill.TotalAmount = request.TotalAmount > 0 ? request.TotalAmount : itemsTotalAmount;
                await _bills.ReplaceOneAsync(session, b => b.Id == bill.Id, bill);

                await session.CommitTransactionAsync();

                // Trả về kết quả
                return new BillWithItemsDTO
                {
                    Id = bill.Id,
                    IdentifyNumber = bill.IdentifyNumber,
                    InvoiceNumber = bill.InvoiceNumber,
                    InvoiceDate = bill.InvoiceDate,
                    InvoiceDueDate = bill.InvoiceDueDate,
                    TaxAmount = bill.TaxAmount,
                    DiscountAmount = bill.DiscountAmount,
                    InvoiceStatus = bill.InvoiceStatus,
                    InvoiceNotes = bill.InvoiceNotes,
                    PaymentMethod = bill.PaymentMethod,
                    Notes = bill.Notes,
                    BillDate = bill.BillDate,
                    Status = bill.Status,
                    TotalAmount = bill.TotalAmount,
                    Email = bill.Email,
                    FirstName = bill.FirstName,
                    LastName = bill.LastName,
                    DateOfBirth = bill.DateOfBirth,
                    Phone = bill.Phone,
                    Address = bill.Address,
                    Items = itemsWithProductInfo
                };
            }
            catch (Exception)
            {
                await session.AbortTransactionAsync();
                throw;
            }
        }
        
        public async Task<BillEntity?> CreateBillOnlyAsync(CreateBillRequest request)
        {
            var billDate = DateTime.UtcNow;
            var bill = new BillEntity
            {
                IdentifyNumber = request.IdentifyNumber,
                InvoiceNumber = string.IsNullOrWhiteSpace(request.InvoiceNumber) ? GenerateInvoiceNumber(billDate) : request.InvoiceNumber,
                InvoiceDate = request.InvoiceDate ?? billDate,
                InvoiceDueDate = request.InvoiceDueDate ?? billDate.AddDays(30), // Mặc định 30 ngày
                TaxAmount = request.TaxAmount,
                DiscountAmount = request.DiscountAmount,
                InvoiceStatus = request.InvoiceStatus ?? "Draft",
                InvoiceNotes = request.InvoiceNotes,
                PaymentMethod = request.PaymentMethod,
                Notes = request.Notes,
                BillDate = billDate,
                Status = request.Status,
                TotalAmount = request.TotalAmount,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                //Gender = request.Gender,
                DateOfBirth = request.DateOfBirth,
                Phone = request.Phone,
                Address = request.Address
            };

            await _bills.InsertOneAsync(bill);
            return bill;
        }

        private string GenerateInvoiceNumber(DateTime billDate)
        {
            var year = billDate.Year.ToString().Substring(2);
            var month = billDate.Month.ToString().PadLeft(2, '0');
            var day = billDate.Day.ToString().PadLeft(2, '0');
            var timePart = billDate.Ticks.ToString().Substring(billDate.Ticks.ToString().Length - 6);
            return $"HD-{year}{month}{day}-{timePart}";
        }

        public async Task<int> FixMissingInvoiceNumbersAsync()
        {
            var filter = Builders<BillEntity>.Filter.Or(
                Builders<BillEntity>.Filter.Eq(b => b.InvoiceNumber, string.Empty),
                Builders<BillEntity>.Filter.Eq(b => b.InvoiceNumber, null),
                Builders<BillEntity>.Filter.Exists(b => b.InvoiceNumber, false)
            );

            var billsToFix = await _bills.Find(filter).ToListAsync();
            if (!billsToFix.Any())
                return 0;

            var models = new List<WriteModel<BillEntity>>();
            foreach (var bill in billsToFix)
            {
                var billDate = bill.BillDate == default ? DateTime.UtcNow : bill.BillDate;
                var invoiceNumber = GenerateInvoiceNumber(billDate);
                models.Add(new UpdateOneModel<BillEntity>(
                    Builders<BillEntity>.Filter.Eq(b => b.Id, bill.Id),
                    Builders<BillEntity>.Update.Set(b => b.InvoiceNumber, invoiceNumber)
                ));
            }

            if (!models.Any())
                return 0;

            var result = await _bills.BulkWriteAsync(models);
            return (int)result.ModifiedCount;
        }

        public async Task<bool> UpdateBillItemsAsync(string billId, List<CreateBillItemRequest> items)
        {
            if (string.IsNullOrEmpty(billId) || items == null)
                return false;

            var bill = await _bills.Find(b => b.Id == billId).FirstOrDefaultAsync();
            if (bill == null)
                return false;

            using var session = await _bills.Database.Client.StartSessionAsync();
            session.StartTransaction();

            try
            {
                var existingItems = await _billItems.Find(session, bi => bi.BillId == billId).ToListAsync();
                var existingItemsById = existingItems
                    .Where(i => !string.IsNullOrWhiteSpace(i.Id))
                    .ToDictionary(i => i.Id, StringComparer.OrdinalIgnoreCase);

                var incomingItemIds = items.Where(i => !string.IsNullOrWhiteSpace(i.Id)).Select(i => i.Id!).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var removedItems = existingItems.Where(i => !incomingItemIds.Contains(i.Id!)).ToList();
                foreach (var removedItem in removedItems)
                {
                    var product = await _products.Find(session, p => p.Id == removedItem.ProductId).FirstOrDefaultAsync();
                    if (product != null)
                    {
                        product.Quantity += removedItem.Quantity;
                        product.UpdatedAt = DateTime.UtcNow;
                        await _products.ReplaceOneAsync(session, p => p.Id == product.Id, product);

                        await _inventoryHistories.InsertOneAsync(session, new InventoryHistory
                        {
                            ProductId = product.Id ?? string.Empty,
                            QuantityChanged = removedItem.Quantity,
                            ActionType = "RESTORE",
                            ActionDate = DateTime.UtcNow,
                            IdDepartment = product.idDepartment ?? string.Empty
                        });
                    }

                    await _billItems.DeleteOneAsync(session, bi => bi.Id == removedItem.Id);
                }

                foreach (var item in items)
                {
                    if (string.IsNullOrWhiteSpace(item.ProductId) || item.Quantity < 0)
                        return false;

                    var product = await _products.Find(session, p => p.Id == item.ProductId).FirstOrDefaultAsync();
                    if (product == null)
                        return false;

                    var existingItem = !string.IsNullOrWhiteSpace(item.Id) && existingItemsById.ContainsKey(item.Id)
                        ? existingItemsById[item.Id]
                        : null;

                    if (existingItem != null && existingItem.ProductId != item.ProductId)
                        return false;

                    var previousQuantity = existingItem?.Quantity ?? 0;
                    var quantityDelta = item.Quantity - previousQuantity;

                    if (quantityDelta > 0 && product.Quantity < quantityDelta)
                        return false;

                    if (existingItem != null)
                    {
                        existingItem.Quantity = item.Quantity;
                        existingItem.Price = item.Price > 0 ? item.Price : product.Price;
                        existingItem.Total = item.Total > 0 ? item.Total : existingItem.Quantity * existingItem.Price;
                        await _billItems.ReplaceOneAsync(session, bi => bi.Id == existingItem.Id, existingItem);
                    }
                    else
                    {
                        var billItem = new BillItemEntity
                        {
                            BillId = billId,
                            ProductId = item.ProductId,
                            Quantity = item.Quantity,
                            Price = item.Price > 0 ? item.Price : product.Price,
                            Total = item.Total > 0 ? item.Total : item.Quantity * (item.Price > 0 ? item.Price : product.Price)
                        };
                        await _billItems.InsertOneAsync(session, billItem);
                    }

                    if (quantityDelta != 0)
                    {
                        product.Quantity -= quantityDelta;
                        product.UpdatedAt = DateTime.UtcNow;
                        await _products.ReplaceOneAsync(session, p => p.Id == product.Id, product);

                        await _inventoryHistories.InsertOneAsync(session, new InventoryHistory
                        {
                            ProductId = product.Id ?? string.Empty,
                            QuantityChanged = -quantityDelta,
                            ActionType = quantityDelta > 0 ? "Xuất kho" : "RESTORE",
                            ActionDate = DateTime.UtcNow,
                            IdDepartment = product.idDepartment ?? string.Empty
                        });
                    }
                }

                var currentBillItems = await _billItems.Find(session, bi => bi.BillId == billId).ToListAsync();
                var totalAmount = currentBillItems.Sum(i => i.Total);
                await _bills.UpdateOneAsync(session, b => b.Id == billId, Builders<BillEntity>.Update.Set(b => b.TotalAmount, totalAmount));

                await session.CommitTransactionAsync();
                return true;
            }
            catch
            {
                await session.AbortTransactionAsync();
                throw;
            }
        }

        public async Task<bool> UpdateBillAsync(string billId, UpdateBillRequest request)
        {
            if (string.IsNullOrWhiteSpace(billId) || request == null)
                return false;

            var updates = new List<UpdateDefinition<BillEntity>>();
            var updateBuilder = Builders<BillEntity>.Update;

            if (request.IdentifyNumber != null)
                updates.Add(updateBuilder.Set(b => b.IdentifyNumber, request.IdentifyNumber));
            if (request.InvoiceNumber != null)
                updates.Add(updateBuilder.Set(b => b.InvoiceNumber, request.InvoiceNumber));
            if (request.InvoiceDate.HasValue)
                updates.Add(updateBuilder.Set(b => b.InvoiceDate, request.InvoiceDate.Value));
            if (request.InvoiceDueDate.HasValue)
                updates.Add(updateBuilder.Set(b => b.InvoiceDueDate, request.InvoiceDueDate.Value));
            if (request.TaxAmount.HasValue)
                updates.Add(updateBuilder.Set(b => b.TaxAmount, request.TaxAmount.Value));
            if (request.DiscountAmount.HasValue)
                updates.Add(updateBuilder.Set(b => b.DiscountAmount, request.DiscountAmount.Value));
            if (request.InvoiceStatus != null)
                updates.Add(updateBuilder.Set(b => b.InvoiceStatus, request.InvoiceStatus));
            if (request.InvoiceNotes != null)
                updates.Add(updateBuilder.Set(b => b.InvoiceNotes, request.InvoiceNotes));
            if (request.PaymentMethod != null)
                updates.Add(updateBuilder.Set(b => b.PaymentMethod, request.PaymentMethod));
            if (request.Notes != null)
                updates.Add(updateBuilder.Set(b => b.Notes, request.Notes));
            if (request.Email != null)
                updates.Add(updateBuilder.Set(b => b.Email, request.Email));
            if (request.FirstName != null)
                updates.Add(updateBuilder.Set(b => b.FirstName, request.FirstName));
            if (request.LastName != null)
                updates.Add(updateBuilder.Set(b => b.LastName, request.LastName));
            if (request.Status != null)
                updates.Add(updateBuilder.Set(b => b.Status, request.Status));
            if (request.Phone != null)
                updates.Add(updateBuilder.Set(b => b.Phone, request.Phone));
            if (request.Address != null)
                updates.Add(updateBuilder.Set(b => b.Address, request.Address));
            if (request.TotalAmount.HasValue)
                updates.Add(updateBuilder.Set(b => b.TotalAmount, request.TotalAmount.Value));
            if (request.DateOfBirth.HasValue)
                updates.Add(updateBuilder.Set(b => b.DateOfBirth, request.DateOfBirth.Value));

            if (!updates.Any())
                return false;

            var combinedUpdate = updateBuilder.Combine(updates);
            var result = await _bills.UpdateOneAsync(b => b.Id == billId, combinedUpdate);

            return result.ModifiedCount > 0;
        }

        public async Task<List<BillWithItemsDTO>> GetAllBillsAsync()
        {
            var bills = await _bills.Find(_ => true).ToListAsync();
            var billIds = bills.Select(b => b.Id).Where(id => !string.IsNullOrEmpty(id)).ToList();

            // Lấy tất cả items có billId hợp lệ thuộc các hóa đơn
            var items = await _billItems.Find(item => !string.IsNullOrEmpty(item.BillId) && billIds.Contains(item.BillId)).ToListAsync();

            // Ghép bill và items
            var result = bills.Select(b => new BillWithItemsDTO
            {
                Id = b.Id,
                IdentifyNumber = b.IdentifyNumber,
                PaymentMethod = b.PaymentMethod,
                Notes = b.Notes,
                BillDate = b.BillDate,
                Status = b.Status,
                TotalAmount = b.TotalAmount,
                Email = b.Email,
                FirstName = b.FirstName,
                LastName = b.LastName,
                //Gender = b.Gender,
                DateOfBirth = b.DateOfBirth,
                Phone = b.Phone,
                Address = b.Address,
                Items = items
                    .Where(i => i.BillId == b.Id)
                    .Select(i => new ShoppingCartItemDTO2
                    {
                        ProductId = i.ProductId,
                        Quantity = i.Quantity,
                        Price = i.Price,
                        Total = i.Total
                    })
                    .ToList()
            }).ToList();
            return result;
        }

        public async Task<(List<BillWithItemsDTO>, long)> GetAllBillsAsync(int page, int pageSize)
        {
            var totalCount = await _bills.CountDocumentsAsync(_ => true);
            var bills = await _bills.Find(_ => true)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var billIds = bills.Select(b => b.Id).Where(id => !string.IsNullOrEmpty(id)).ToList();

            // Lấy items cho bills trong page này
            var items = billIds.Any()
                ? await _billItems.Find(item => !string.IsNullOrEmpty(item.BillId) && billIds.Contains(item.BillId)).ToListAsync()
                : new List<BillItemEntity>();

            // Ghép bill và items
            var result = bills.Select(b => new BillWithItemsDTO
            {
                Id = b.Id,
                IdentifyNumber = b.IdentifyNumber,
                PaymentMethod = b.PaymentMethod,
                Notes = b.Notes,
                BillDate = b.BillDate,
                Status = b.Status,
                TotalAmount = b.TotalAmount,
                Email = b.Email,
                FirstName = b.FirstName,
                LastName = b.LastName,
                DateOfBirth = b.DateOfBirth,
                Phone = b.Phone,
                Address = b.Address,
                Items = items
                    .Where(i => i.BillId == b.Id)
                    .Select(i => new ShoppingCartItemDTO2
                    {
                        ProductId = i.ProductId,
                        Quantity = i.Quantity,
                        Price = i.Price,
                        Total = i.Total
                    })
                    .ToList()
            }).ToList();

            return (result, totalCount);
        }

        public async Task<BillEntity?> GetBillByIdAsync(string billId) =>
            await _bills.Find(b => b.Id == billId).FirstOrDefaultAsync();

        public async Task<BillDetailsDTO?> GetBillDetailsAsync(string billId)
        {
            var billTask = _bills.Find(b => b.Id == billId).FirstOrDefaultAsync();
            var billItemsTask = _billItems.Find(i => i.BillId == billId).ToListAsync();

            await Task.WhenAll(billTask, billItemsTask);

            var bill = await billTask;
            if (bill == null)
                return null;

            var billItems = await billItemsTask;
            var productIds = billItems
                .Select(i => i.ProductId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            var products = productIds.Any()
                ? await _products.Find(p => p.Id != null && productIds.Contains(p.Id)).ToListAsync()
                : new List<ProductEntity>();

            var productMap = products
                .Where(p => !string.IsNullOrWhiteSpace(p.Id))
                .ToDictionary(p => p.Id!, p => p);

            var items = billItems.Select(item =>
            {
                productMap.TryGetValue(item.ProductId, out var product);
                return new BillItemWithProductNameDTO
                {
                    Id = item.Id,
                    BillId = item.BillId,
                    ProductId = item.ProductId,
                    ProductName = product?.Name ?? "N/A",
                    ProductCode = product?.ProductCode,
                    Unit = product?.Unit,
                    Category = product?.Category,
                    ImageUrl = product?.ImageUrl ?? product?.ImageUrls?.FirstOrDefault(),
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Total = item.Total
                };
            }).ToList();

            return new BillDetailsDTO
            {
                Bill = bill,
                Items = items,
                TotalAmount = bill.TotalAmount
            };
        }

        public async Task<List<BillItemEntity>> GetBillItemsAsync(string billId) =>
            await _billItems.Find(i => i.BillId == billId).ToListAsync();
        public async Task<List<BillEntity>> SearchBillsAsync(
        double? minTotalAmount,
        double? maxTotalAmount,
        string? timeRange,
        string? paymentMethod,
        string? status)
        {
            var filterBuilder = Builders<BillEntity>.Filter;
            var filters = new List<FilterDefinition<BillEntity>>();

            if (minTotalAmount.HasValue)
                filters.Add(filterBuilder.Gt(b => b.TotalAmount, minTotalAmount.Value));

            if (maxTotalAmount.HasValue)
                filters.Add(filterBuilder.Lt(b => b.TotalAmount, maxTotalAmount.Value));

            if (!string.IsNullOrEmpty(timeRange))
            {
                DateTime startTime = timeRange switch
                {
                    "1d" => DateTime.UtcNow.AddDays(-1),
                    "7d" => DateTime.UtcNow.AddDays(-7),
                    "30d" => DateTime.UtcNow.AddDays(-30),
                    "1m" => DateTime.UtcNow.AddMonths(-1),
                    "1y" => DateTime.UtcNow.AddYears(-1),
                    _ => DateTime.MinValue
                };

                filters.Add(filterBuilder.Gte(b => b.BillDate, startTime));
            }

            if (!string.IsNullOrEmpty(paymentMethod))
                filters.Add(filterBuilder.Eq(b => b.PaymentMethod, paymentMethod));

            if (!string.IsNullOrEmpty(status))
                filters.Add(filterBuilder.Eq(b => b.Status, status));

            var combinedFilter = filters.Any()
                ? filterBuilder.And(filters)
                : filterBuilder.Empty;

            return await _bills.Find(combinedFilter).ToListAsync();
        }
        public async Task<bool> UpdateBillStatusAsync(string billId, string newStatus,string newAddress) 
        {
            var validStatuses = new[] { "Thành công", "Đang chờ xác nhận", "Hủy", "Đã xuất hóa đơn" };

            if (!validStatuses.Contains(newStatus))
                return false;

            // Get the current bill to get the previous status
            var bill = await _bills.Find(b => b.Id == billId).FirstOrDefaultAsync();
            if (bill == null)
                return false;

            var update = Builders<BillEntity>.Update
            .Set(b => b.Status, newStatus)
            .Set(b => b.Address, newAddress);
            var result = await _bills.UpdateOneAsync(b => b.Id == billId, update);

            if (result.ModifiedCount > 0)
            {
                // Record the status change to history
                await _statusBillHistoryService.RecordStatusChangeAsync(
                    billId, 
                    bill.Status, 
                    newStatus, 
                    newAddress,
                    "System"
                );
            }

            return result.ModifiedCount > 0;
        }
        public async Task<bool> DeleteBillAsync(string billId, bool restoreInventory = false)
        {
            var bill = await _bills.Find(x => x.Id == billId).FirstOrDefaultAsync();
            if (bill == null)
                return false;

            // Lấy các bill item trước khi xóa
            var billItems = await _billItems.Find(b => b.BillId == billId).ToListAsync();

            if (restoreInventory && billItems != null && billItems.Any())
            {
                foreach (var item in billItems)
                {
                    var product = await _products.Find(p => p.Id == item.ProductId).FirstOrDefaultAsync();
                    if (product != null)
                    {
                        // Hoàn lại số lượng
                        product.Quantity += item.Quantity;
                        product.UpdatedAt = DateTime.UtcNow;

                        await _products.ReplaceOneAsync(p => p.Id == (product.Id ?? string.Empty), product);

                        // Ghi lịch sử nhập kho
                        var history = new InventoryHistory
                        {
                            ProductId = product.Id ?? string.Empty,
                            QuantityChanged = item.Quantity, // cộng ngược
                            ActionType = "RESTORE", // hoặc "Hoàn kho"
                            ActionDate = DateTime.UtcNow,
                            IdDepartment = product.idDepartment ?? string.Empty
                        };

                        await _inventoryHistories.InsertOneAsync(history);
                    }
                }
            }

            // Xóa bill items
            await _billItems.DeleteManyAsync(b => b.BillId == billId);

            // Xóa bill
            var deleteBillResult = await _bills.DeleteOneAsync(b => b.Id == billId);

            return deleteBillResult.DeletedCount > 0;
        }



        public async Task<List<BillWithItemsDTO>> GetBillsByDepartmentAsync(string? departmentId)
        {
            if (departmentId == null)
                return null!;

            var productIds = await _products
                .Find(p => p.idDepartment == departmentId)
                .Project(p => p.Id)
                .ToListAsync();

            if (!productIds.Any())
                return new List<BillWithItemsDTO>();

            // Bước 2: Lấy billItem có ProductId thuộc department đó
            var billItems = await _billItems
                .Find(bi => productIds.Contains(bi.ProductId))
                .ToListAsync();

            if (!billItems.Any())
                return new List<BillWithItemsDTO>();

            // Bước 3: Lấy các bill liên quan
            var billIds = billItems.Select(bi => bi.BillId).Distinct().ToList();
            var bills = await _bills.Find(b => billIds.Contains(b.Id)).ToListAsync();

            // Bước 4: Map sang BillWithItemsDTO
            var result = bills.Select(b => new BillWithItemsDTO
            {
                Id = b.Id,
                IdentifyNumber = b.IdentifyNumber,
                PaymentMethod = b.PaymentMethod,
                Notes = b.Notes,
                BillDate = b.BillDate,
                Status = b.Status,
                TotalAmount = b.TotalAmount,
                Email = b.Email,
                FirstName = b.FirstName,
                LastName = b.LastName,
                //Gender = b.Gender,
                DateOfBirth = b.DateOfBirth,
                Phone = b.Phone,
                Address = b.Address,
                Items = billItems
                .Where(item => (item.BillId ?? string.Empty) == b.Id && productIds.Contains(item.ProductId ?? string.Empty))
                .Select(item => new ShoppingCartItemDTO2{
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                Price = item.Price,
                Total = item.Total
                }).ToList()
                }).ToList();

            return result;
        }
        public async Task<BillWithItemsDTO?> LookupBillAsync(string email, string billId)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(billId))
                return null!;
            
            var emailExists = await _bills.Find(b => b.Email == email).AnyAsync();
            if (!emailExists)
                return null;

           
            var bill = await _bills.Find(b => b.Id == billId && b.Email == email).FirstOrDefaultAsync();
            if (bill == null)
                return null;

            var items = await _billItems.Find(i => i.BillId == billId).ToListAsync();

            return new BillWithItemsDTO
            {
                Id = bill.Id,
                IdentifyNumber = bill.IdentifyNumber,
                PaymentMethod = bill.PaymentMethod,
                Notes = bill.Notes,
                BillDate = bill.BillDate,
                Status = bill.Status,
                TotalAmount = bill.TotalAmount,
                Email = bill.Email,
                FirstName = bill.FirstName,
                LastName = bill.LastName,
                DateOfBirth = bill.DateOfBirth,
                Phone = bill.Phone,
                Address = bill.Address,
                Items = items.Select(i => new ShoppingCartItemDTO2
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    Price = i.Price,
                    Total = i.Total
                }).ToList()
            };
        }



    }
}
