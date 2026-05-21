using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace API_VanHungThinh.Services
{
    public class ProductService : BaseRepository<ProductEntity>, IProductService
    {
        private readonly IMongoCollection<InventoryHistory> _inventoryHistoryCollection;
        private static readonly Dictionary<string, string[]> _brandKeywords = new()
        {
            { "honda", new[] { "honda" } },
            { "toyota", new[] { "toyota" } },
            { "mazda", new[] { "mazda" } },
            { "ford", new[] { "ford", "isuzu" } },
        };

        public ProductService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient)
            : base(mongoDbSettings, mongoClient, "product")
        {
            var database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
            _inventoryHistoryCollection = database.GetCollection<InventoryHistory>("inventory_history");

            // Create indexes for better performance
            Task.Run(async () =>
            {
                try
                {
                    // Text index for search on Name and ProductCode
                    await _collection.Indexes.CreateOneAsync(
                        new CreateIndexModel<ProductEntity>(
                            Builders<ProductEntity>.IndexKeys.Text(p => p.Name).Text(p => p.ProductCode)
                        )
                    );

                    // Index on idDepartment for filtering
                    await _collection.Indexes.CreateOneAsync(
                        new CreateIndexModel<ProductEntity>(
                            Builders<ProductEntity>.IndexKeys.Ascending(p => p.idDepartment)
                        )
                    );

                    // Index on Category
                    await _collection.Indexes.CreateOneAsync(
                        new CreateIndexModel<ProductEntity>(
                            Builders<ProductEntity>.IndexKeys.Ascending(p => p.Category)
                        )
                    );
                }
                catch (Exception ex)
                {
                    // Log or handle index creation errors silently to avoid startup failures
                    Console.WriteLine($"Index creation failed: {ex.Message}");
                }
            });
        }

        public override async Task CreateAsync(ProductEntity product)
        {
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = product.CreatedAt;
            await _collection.InsertOneAsync(product);
        }

        public override async Task UpdateAsync(string id, ProductEntity updatedProduct)
        {
            updatedProduct.UpdatedAt = DateTime.UtcNow;
            await _collection.ReplaceOneAsync(p => p.Id == id, updatedProduct);
        }

        public override async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(p => p.Id == id);

        public async Task<List<ProductEntity>> GetSearchAsync(string? id_department,string? name, string? category)
        {
            var filterBuilder = Builders<ProductEntity>.Filter;
            var filters = new List<FilterDefinition<ProductEntity>>();
            if (!string.IsNullOrEmpty(id_department))
                filters.Add(filterBuilder.Eq(p => p.idDepartment, id_department));


            if (!string.IsNullOrEmpty(name))
            {
                // Regex không phân biệt hoa thường, tìm chứa từ khoá cho cả tên và mã sản phẩm
                var regex = new MongoDB.Bson.BsonRegularExpression(name, "i");
                var orFilter = filterBuilder.Or(
                    filterBuilder.Regex(p => p.Name, regex),
                    filterBuilder.Regex(p => p.ProductCode, regex)
                );
                filters.Add(orFilter);
            }

            if (!string.IsNullOrEmpty(category))
                filters.Add(filterBuilder.Eq(p => p.Category, category));

            var combinedFilter = filters.Any()
                ? filterBuilder.And(filters)
                : filterBuilder.Empty;

            return await _collection.Find(combinedFilter).ToListAsync();
        }

        public async Task<(List<ProductEntity>, long)> GetPagedAsync(
            int page,
            int pageSize,
            string? search,
            IEnumerable<string>? categories,
            IEnumerable<string>? brands,
            IEnumerable<string>? status,
            double? maxPrice,
            string? sort)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 1000) pageSize = 50;

            var filterBuilder = Builders<ProductEntity>.Filter;
            var filters = new List<FilterDefinition<ProductEntity>>();

            if (!string.IsNullOrEmpty(search))
            {
                var regex = new BsonRegularExpression(search, "i");
                filters.Add(filterBuilder.Or(
                    filterBuilder.Regex(p => p.Name, regex),
                    filterBuilder.Regex(p => p.ProductCode, regex)));
            }

            if (categories?.Any() == true)
            {
                var categoryList = categories.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
                if (categoryList.Any())
                    filters.Add(filterBuilder.In(p => p.Category, categoryList));
            }

            if (brands?.Any() == true)
            {
                var brandFilters = brands
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(brand => {
                        var lowerBrand = brand.Trim().ToLowerInvariant();
                        var terms = _brandKeywords.ContainsKey(lowerBrand)
                            ? _brandKeywords[lowerBrand]
                            : new[] { lowerBrand };
                        var regex = new BsonRegularExpression(string.Join("|", terms.Select(Regex.Escape)), "i");

                        return filterBuilder.Or(
                            filterBuilder.Regex(p => p.Name, regex),
                            filterBuilder.Regex(p => p.ProductCode, regex));
                    })
                    .ToList();
                if (brandFilters.Any())
                    filters.Add(filterBuilder.Or(brandFilters));
            }

            if (status?.Any() == true)
            {
                var statusFilters = new List<FilterDefinition<ProductEntity>>();
                if (status.Contains("in-stock"))
                    statusFilters.Add(filterBuilder.Gt(p => p.Quantity, 0));
                if (status.Contains("out-stock"))
                    statusFilters.Add(filterBuilder.Eq(p => p.Quantity, 0));
                if (statusFilters.Any())
                    filters.Add(filterBuilder.Or(statusFilters));
            }

            if (maxPrice.HasValue)
                filters.Add(filterBuilder.Lte(p => p.Price, maxPrice.Value));

            var combinedFilter = filters.Any()
                ? filterBuilder.And(filters)
                : filterBuilder.Empty;

            var sortDefinition = sort switch
            {
                "price-asc" => Builders<ProductEntity>.Sort.Ascending(p => p.Price),
                "price-desc" => Builders<ProductEntity>.Sort.Descending(p => p.Price),
                "name-asc" => Builders<ProductEntity>.Sort.Ascending(p => p.Name),
                "name-desc" => Builders<ProductEntity>.Sort.Descending(p => p.Name),
                _ => Builders<ProductEntity>.Sort.Ascending(p => p.Name)
            };

            var totalCount = await _collection.CountDocumentsAsync(combinedFilter);
            var items = await _collection.Find(combinedFilter)
                .Sort(sortDefinition)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<CategoryCountResult>> GetCategoriesWithCountsAsync()
        {
            var aggregation = await _collection.Aggregate()
                .Group(new BsonDocument
                {
                    { "_id", "$category" },
                    { "count", new BsonDocument("$sum", 1) }
                })
                .Sort(new BsonDocument("_id", 1))
                .ToListAsync();

            return aggregation.Select(doc => new CategoryCountResult
            {
                Category = doc["_id"].AsString,
                Count = doc["count"].ToInt64()
            }).ToList();
        }

        public async Task<List<BrandCountResult>> GetBrandsWithCountsAsync()
        {
            var results = new List<BrandCountResult>();
            foreach (var kvp in _brandKeywords)
            {
                var regex = new BsonRegularExpression(string.Join("|", kvp.Value.Select(Regex.Escape)), "i");
                var filter = Builders<ProductEntity>.Filter.Or(
                    Builders<ProductEntity>.Filter.Regex(p => p.Name, regex),
                    Builders<ProductEntity>.Filter.Regex(p => p.ProductCode, regex)
                );

                var count = await _collection.CountDocumentsAsync(filter);
                results.Add(new BrandCountResult
                {
                    Brand = kvp.Key,
                    Count = count
                });
            }
            return results;
        }

        public async Task<List<StatusCountResult>> GetStatusesWithCountsAsync()
        {
            var inStockFilter = Builders<ProductEntity>.Filter.Gt(p => p.Quantity, 0);
            var outStockFilter = Builders<ProductEntity>.Filter.Eq(p => p.Quantity, 0);

            var inStockCount = await _collection.CountDocumentsAsync(inStockFilter);
            var outStockCount = await _collection.CountDocumentsAsync(outStockFilter);

            return new List<StatusCountResult>
            {
                new StatusCountResult { Status = "in-stock", Count = inStockCount },
                new StatusCountResult { Status = "out-stock", Count = outStockCount }
            };
        }

        //  Cập nhật số lượng và ghi lịch sử thay đổi tồn kho
        public async Task<bool> UpdateInventoryAndLogAsync(string productId, int quantityChanged)
        {
            // Use atomic update ($inc) to avoid race conditions when multiple requests update the same product concurrently.
            var filter = Builders<ProductEntity>.Filter.Eq(p => p.Id, productId);

            // If quantityChanged is negative, ensure we don't allow resulting quantity < 0
            if (quantityChanged < 0)
            {
                filter &= Builders<ProductEntity>.Filter.Gte(p => p.Quantity, -quantityChanged);
            }

            var update = Builders<ProductEntity>.Update
                .Inc(p => p.Quantity, quantityChanged)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            var options = new FindOneAndUpdateOptions<ProductEntity>
            {
                ReturnDocument = ReturnDocument.After
            };

            var updatedProduct = await _collection.FindOneAndUpdateAsync(filter, update, options);

            if (updatedProduct == null)
            {
                // Either product not found or negative stock prevention triggered
                return false;
            }

            var history = new InventoryHistory
            {
                ProductId = productId,
                QuantityChanged = quantityChanged,
                ActionType = "Nhập kho hàng",
                ActionDate = DateTime.UtcNow,
                IdDepartment = updatedProduct.idDepartment ?? string.Empty
            };

            await _inventoryHistoryCollection.InsertOneAsync(history);

            return true;
        }
        //  API lấy lịch sử thay đổi của 1 sản phẩm
        public async Task<List<InventoryHistory>> GetInventoryHistoryByProductIdAsync(string productId)
        {
            return await _inventoryHistoryCollection
                .Find(h => h.ProductId == productId)
                .SortByDescending(h => h.ActionDate)
                .ToListAsync();
        }
        public async Task<List<InventoryReportResult>> GetInventoryReportAsync(InventoryReportFilter filter)
        {
            var builder = Builders<InventoryHistory>.Filter;
            var matchFilter = builder.Empty;

            if (filter.FromDate.HasValue)
                matchFilter &= builder.Gte(h => h.ActionDate, filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                matchFilter &= builder.Lte(h => h.ActionDate, filter.ToDate.Value);

            if (!string.IsNullOrEmpty(filter.DepartmentId))
                matchFilter &= builder.Eq(h => h.IdDepartment, filter.DepartmentId);

            if (!string.IsNullOrEmpty(filter.ActionType))
                matchFilter &= builder.Eq(h => h.ActionType, filter.ActionType);

            var dateFormat = filter.GroupBy == "monthly" ? "%Y-%m" : "%Y-%m-%d";

            var pipeline = _inventoryHistoryCollection.Aggregate()
                .Match(matchFilter)
                .Group(new BsonDocument
                {
            { "_id", new BsonDocument
                {
                    { "groupDate", new BsonDocument("$dateToString", new BsonDocument {
                        { "format", dateFormat },
                        { "date", "$actionDate" }
                    })},
                    { "departmentId", "$idDepartment" },
                    { "actionType", "$actionType" },
                    { "productId", "$productId" } // thêm vào đây
                }
            },
            { "totalQuantityChanged", new BsonDocument("$sum", "$quantityChanged") }
                })
                .Sort(new BsonDocument("_id.groupDate", 1));

            var result = await pipeline.ToListAsync();

            return result.Select(doc => new InventoryReportResult
            {
                ProductId = doc["_id"].AsBsonDocument.TryGetValue("productId", out var prodVal) && !prodVal.IsBsonNull ? prodVal.AsString : null,
                GroupDate = doc["_id"]["groupDate"].IsBsonNull ? null : doc["_id"]["groupDate"].AsString,
                DepartmentId = doc["_id"].AsBsonDocument.TryGetValue("departmentId", out var deptVal) && !deptVal.IsBsonNull ? deptVal.AsString : null,
                ActionType = doc["_id"].AsBsonDocument.TryGetValue("actionType", out var actVal) && !actVal.IsBsonNull ? actVal.AsString : null,
                TotalQuantityChanged = doc.Contains("totalQuantityChanged") ? doc["totalQuantityChanged"].ToInt32() : 0
            }).ToList();
        }


}
}
