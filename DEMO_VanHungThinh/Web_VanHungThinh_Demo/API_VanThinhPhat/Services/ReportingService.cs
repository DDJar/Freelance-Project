using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO.Reports;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Driver.Linq;

namespace API_VanHungThinh.Services
{
    public class ReportingService : IReportingService
    {
        private readonly IMongoCollection<BillEntity> _bills;
        private readonly IMongoCollection<BillItemEntity> _billItems;
        private readonly IMongoCollection<ProductEntity> _products;
        private readonly IMongoCollection<InventoryHistory> _inventoryHistories;
        private readonly IMongoCollection<CustomerEntity> _customers;

        public ReportingService(IOptions<MongoDbSettings> settings, IMongoClient mongoClient)
        {
            var db = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _bills = db.GetCollection<BillEntity>("bill");
            _billItems = db.GetCollection<BillItemEntity>("billItem");
            _products = db.GetCollection<ProductEntity>("product");
            _inventoryHistories = db.GetCollection<InventoryHistory>("inventory_history");
            _customers = db.GetCollection<CustomerEntity>("customer");
        }

        public async Task<RevenueReportData> GetRevenueSummaryAsync(RevenueReportParams parameters)
        {
            var fromDate = DateTime.Parse(parameters.From).Date;
            var toDate = DateTime.Parse(parameters.To).Date.AddDays(1).AddTicks(-1);

            // Build filter
            var filterBuilder = Builders<BillEntity>.Filter;
            var filter = filterBuilder.Gte(b => b.BillDate, fromDate) &
                        filterBuilder.Lte(b => b.BillDate, toDate);

            if (!string.IsNullOrEmpty(parameters.Status))
                filter &= filterBuilder.Eq(b => b.Status, parameters.Status);

            if (!string.IsNullOrEmpty(parameters.Channel))
                filter &= filterBuilder.Eq(b => b.PaymentMethod, parameters.Channel);

            // Note: Department filtering would require department field in BillEntity
            // For now, we'll skip department filtering as it's not implemented in the current schema

            var bills = await _bills.Find(filter).ToListAsync();

            // Calculate totals
            var totalRevenue = bills.Sum(b => b.TotalAmount);
            var billCount = bills.Count;
            var averageBillValue = billCount > 0 ? totalRevenue / billCount : 0;

            // Calculate previous period for growth rate
            var periodDays = (toDate - fromDate).TotalDays;
            var previousFromDate = fromDate.AddDays(-periodDays);
            var previousToDate = fromDate.AddTicks(-1);

            var previousFilter = filterBuilder.Gte(b => b.BillDate, previousFromDate) &
                               filterBuilder.Lte(b => b.BillDate, previousToDate);
            if (!string.IsNullOrEmpty(parameters.Status))
                previousFilter &= filterBuilder.Eq(b => b.Status, parameters.Status);
            if (!string.IsNullOrEmpty(parameters.Channel))
                previousFilter &= filterBuilder.Eq(b => b.PaymentMethod, parameters.Channel);

            var previousBills = await _bills.Find(previousFilter).ToListAsync();
            var previousRevenue = previousBills.Sum(b => b.TotalAmount);
            var growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

            // Find best day
            var dailyRevenue = bills.GroupBy(b => b.BillDate.Date)
                                   .Select(g => new { Date = g.Key, Revenue = g.Sum(b => b.TotalAmount) })
                                   .OrderByDescending(x => x.Revenue)
                                   .FirstOrDefault();

            // Build trend data (daily)
            var trend = bills.GroupBy(b => b.BillDate.Date)
                           .Select(g => new RevenueTrendPoint
                           {
                               Bucket = g.Key.ToString("yyyy-MM-dd"),
                               Label = g.Key.ToString("dd/MM"),
                               Revenue = g.Sum(b => b.TotalAmount),
                               BillCount = g.Count(),
                               AverageBillValue = g.Count() > 0 ? g.Sum(b => b.TotalAmount) / g.Count() : 0
                           })
                           .OrderBy(t => t.Bucket)
                           .ToList();

            // Build breakdown
            var channelBreakdown = bills.GroupBy(b => b.PaymentMethod ?? "Unknown")
                                       .Select(g => new RevenueChannelSlice
                                       {
                                           Channel = g.Key,
                                           BillCount = g.Count(),
                                           Revenue = g.Sum(b => b.TotalAmount)
                                       })
                                       .ToList();

            var customerBreakdown = bills.GroupBy(b =>
                                       string.IsNullOrWhiteSpace(b.Email)
                                         ? $"{b.FirstName} {b.LastName}".Trim()
                                         : b.Email!)
                                       .Select(g => new RevenueCustomerSlice
                                       {
                                           CustomerId = g.Key,
                                           Name = string.IsNullOrWhiteSpace(g.First().Email)
                                               ? $"{g.First().FirstName} {g.First().LastName}".Trim()
                                               : g.First().Email ?? "Khách hàng khác",
                                           Revenue = g.Sum(b => b.TotalAmount),
                                           BillCount = g.Count(),
                                           LastBillDate = g.Max(b => b.BillDate)
                                       })
                                       .OrderByDescending(c => c.Revenue)
                                       .Take(10)
                                       .ToList();

            var billIds = bills.Select(b => b.Id).ToList();
            var categoryBreakdown = new List<RevenueCategorySlice>();
            var categoryTrend = new List<RevenueCategoryTrendPoint>();
            var topProducts = new List<RevenueProductSlice>();
            if (billIds.Any())
            {
                var billItems = await _billItems.Find(item => billIds.Contains(item.BillId ?? string.Empty)).ToListAsync();
                var productIds = billItems.Select(item => item.ProductId)
                    .Where(productId => !string.IsNullOrWhiteSpace(productId))
                    .Distinct()
                    .ToList();
                var products = await _products.Find(p => !string.IsNullOrEmpty(p.Id) && productIds.Contains(p.Id)).ToListAsync();
                var billDateMap = bills.ToDictionary(b => b.Id, b => b.BillDate);
                var productMap = products
                    .Where(p => !string.IsNullOrEmpty(p.Id))
                    .ToDictionary(p => p.Id!, p => p);

                topProducts = billItems.GroupBy(item => item.ProductId)
                    .Select(g => new RevenueProductSlice
                    {
                        ProductId = g.Key,
                        Name = products.FirstOrDefault(p => p.Id == g.Key)?.Name ?? "Sản phẩm khác",
                        Quantity = g.Sum(item => item.Quantity),
                        Revenue = g.Sum(item => item.Total)
                    })
                    .OrderByDescending(p => p.Revenue)
                    .Take(10)
                    .ToList();

                categoryBreakdown = billItems
                    .GroupBy(item =>
                    {
                        if (productMap.TryGetValue(item.ProductId, out var product) &&
                            !string.IsNullOrWhiteSpace(product.Category))
                        {
                            return product.Category.Trim();
                        }

                        return "Khac";
                    })
                    .Select(g => new RevenueCategorySlice
                    {
                        Category = g.Key,
                        Quantity = g.Sum(item => item.Quantity),
                        Revenue = g.Sum(item => item.Total)
                    })
                    .OrderByDescending(c => c.Revenue)
                    .ToList();

                categoryTrend = billItems
                    .Where(item => !string.IsNullOrEmpty(item.BillId) && billDateMap.ContainsKey(item.BillId!))
                    .GroupBy(item => new
                    {
                        Month = billDateMap[item.BillId!].ToString("yyyy-MM"),
                        Category = productMap.TryGetValue(item.ProductId, out var product) &&
                                   !string.IsNullOrWhiteSpace(product.Category)
                            ? product.Category.Trim()
                            : "Khac"
                    })
                    .Select(g => new { g.Key.Month, g.Key.Category, Revenue = g.Sum(item => item.Total) })
                    .GroupBy(item => item.Month)
                    .Select(g => new RevenueCategoryTrendPoint
                    {
                        Month = g.Key,
                        Categories = g.ToDictionary(item => item.Category, item => item.Revenue)
                    })
                    .OrderBy(point => point.Month)
                    .ToList();
            }

            var breakdown = new RevenueBreakdown
            {
                ByStatus = bills.GroupBy(b => b.Status ?? "Unknown")
                              .Select(g => new RevenueStatusSlice
                              {
                                  Status = g.Key,
                                  BillCount = g.Count(),
                                  Revenue = g.Sum(b => b.TotalAmount)
                              })
                              .ToList(),
                ByChannel = channelBreakdown,
                ByCategory = categoryBreakdown,
                TopCustomers = customerBreakdown,
                TopProducts = topProducts
            };

            return new RevenueReportData
            {
                Filters = new RevenueReportFilters
                {
                    From = parameters.From,
                    To = parameters.To,
                    DepartmentId = parameters.DepartmentId,
                    Channel = parameters.Channel,
                    Status = parameters.Status
                },
                Totals = new RevenueTotals
                {
                    Revenue = totalRevenue,
                    BillCount = billCount,
                    AverageBillValue = averageBillValue,
                    GrowthRatePct = growthRate,
                    PreviousPeriodRevenue = previousRevenue,
                    BestDay = dailyRevenue?.Date.ToString("dd/MM/yyyy"),
                    BestDayRevenue = dailyRevenue?.Revenue
                },
                Trend = trend,
                CategoryTrend = categoryTrend,
                Breakdown = breakdown
            };
        }

        public async Task<InventoryReportData> GetInventoryReportAsync(InventoryReportParams parameters)
        {
            var fromDate = DateTime.Parse(parameters.From).Date;
            var toDate = DateTime.Parse(parameters.To).Date.AddDays(1).AddTicks(-1);

            // Build filter
            var filterBuilder = Builders<InventoryHistory>.Filter;
            var filter = filterBuilder.Gte(ih => ih.ActionDate, fromDate) &
                        filterBuilder.Lte(ih => ih.ActionDate, toDate);

            if (!string.IsNullOrEmpty(parameters.ActionType))
                filter &= filterBuilder.Eq(ih => ih.ActionType, parameters.ActionType);

            var inventoryMovements = await _inventoryHistories.Find(filter).ToListAsync();

            // Calculate summary
            var inbound = inventoryMovements.Where(ih => ih.QuantityChanged > 0).Sum(ih => ih.QuantityChanged);
            var outbound = Math.Abs(inventoryMovements.Where(ih => ih.QuantityChanged < 0).Sum(ih => ih.QuantityChanged));
            var netChange = inventoryMovements.Sum(ih => ih.QuantityChanged);
            var movementCount = inventoryMovements.Count;
            var uniqueSkus = inventoryMovements.Select(ih => ih.ProductId).Distinct().Count();

            // Build trend data
            var trend = inventoryMovements.GroupBy(ih => ih.ActionDate.Date)
                                        .Select(g => new InventoryTrendPoint
                                        {
                                            Bucket = g.Key.ToString("yyyy-MM-dd"),
                                            Inbound = g.Where(ih => ih.QuantityChanged > 0).Sum(ih => ih.QuantityChanged),
                                            Outbound = Math.Abs(g.Where(ih => ih.QuantityChanged < 0).Sum(ih => ih.QuantityChanged))
                                        })
                                        .OrderBy(t => t.Bucket)
                                        .ToList();

            // Top SKUs by movement
            var topSkus = inventoryMovements.GroupBy(ih => ih.ProductId)
                                          .Select(g => {
                                              var product = _products.Find(p => p.Id == g.Key).FirstOrDefault();
                                              return new InventorySkuEntry
                                              {
                                                  ProductId = g.Key,
                                                  Name = product?.Name ?? "Unknown",
                                                  NetChange = g.Sum(ih => ih.QuantityChanged)
                                              };
                                          })
                                          .OrderByDescending(s => Math.Abs(s.NetChange))
                                          .Take(10)
                                          .ToList();

            return new InventoryReportData
            {
                Summary = new InventorySummary
                {
                    TotalInbound = inbound,
                    TotalOutbound = outbound,
                    NetChange = netChange,
                    MovementCount = movementCount,
                    UniqueSkus = uniqueSkus
                },
                Trend = trend,
                TopSkus = topSkus
            };
        }

        public async Task<CustomerAgingReportData> GetCustomerAgingAsync(CustomerAgingParams parameters)
        {
            // For simplicity, we'll use bill data to calculate aging
            // In a real implementation, you'd have separate payment tracking

            var allBills = await _bills.Find(_ => true).ToListAsync();

            // Group bills by customer (using email as identifier since no customerId in BillEntity)
            var customerGroups = allBills.GroupBy(b => b.Email ?? "unknown")
                                       .Where(g => !string.IsNullOrEmpty(g.Key) && g.Key != "unknown")
                                       .ToList();

            var agingBuckets = new List<CustomerAgingBucket>();
            var topCustomers = new List<CustomerAgingCustomer>();
            var totalOutstanding = 0.0;
            var totalCollected = 0.0;
            var overdueCount = 0;

            foreach (var customerGroup in customerGroups)
            {
                var customerBills = customerGroup.ToList();
                var customerOutstanding = customerBills.Where(b => (b.Status ?? "").ToLower() != "paid")
                                                     .Sum(b => b.TotalAmount);
                var customerCollected = customerBills.Where(b => (b.Status ?? "").ToLower() == "paid")
                                                   .Sum(b => b.TotalAmount);

                totalOutstanding += customerOutstanding;
                totalCollected += customerCollected;

                // Check for overdue bills (simplified: bills older than 30 days)
                var overdueBills = customerBills.Where(b =>
                    (b.Status ?? "").ToLower() != "paid" &&
                    (DateTime.UtcNow - b.BillDate).TotalDays > 30);

                if (overdueBills.Any())
                    overdueCount++;

                // Add to top customers if has outstanding
                if (customerOutstanding > 0)
                {
                    topCustomers.Add(new CustomerAgingCustomer
                    {
                        CustomerId = customerGroup.Key,
                        Name = $"{customerBills.First().FirstName} {customerBills.First().LastName}".Trim(),
                        Outstanding = customerOutstanding,
                        BillCount = customerBills.Count,
                        LastPayment = customerBills.Where(b => (b.Status ?? "").ToLower() == "paid")
                                                 .Max(b => (DateTime?)b.BillDate)
                    });
                }

                // Categorize by aging buckets
                var days30 = customerBills.Where(b =>
                    (b.Status ?? "").ToLower() != "paid" &&
                    (DateTime.UtcNow - b.BillDate).TotalDays <= 30)
                    .Sum(b => b.TotalAmount);

                var days60 = customerBills.Where(b =>
                    (b.Status ?? "").ToLower() != "paid" &&
                    (DateTime.UtcNow - b.BillDate).TotalDays > 30 &&
                    (DateTime.UtcNow - b.BillDate).TotalDays <= 60)
                    .Sum(b => b.TotalAmount);

                var days90Plus = customerBills.Where(b =>
                    (b.Status ?? "").ToLower() != "paid" &&
                    (DateTime.UtcNow - b.BillDate).TotalDays > 60)
                    .Sum(b => b.TotalAmount);

                if (days30 > 0)
                {
                    var bucket = agingBuckets.FirstOrDefault(b => b.Label == "0-30 ngày");
                    if (bucket == null)
                    {
                        bucket = new CustomerAgingBucket { Label = "0-30 ngày", Amount = 0, BillCount = 0 };
                        agingBuckets.Add(bucket);
                    }
                    bucket.Amount += days30;
                    bucket.BillCount += customerBills.Count(b =>
                        (b.Status ?? "").ToLower() != "paid" &&
                        (DateTime.UtcNow - b.BillDate).TotalDays <= 30);
                }

                if (days60 > 0)
                {
                    var bucket = agingBuckets.FirstOrDefault(b => b.Label == "31-60 ngày");
                    if (bucket == null)
                    {
                        bucket = new CustomerAgingBucket { Label = "31-60 ngày", Amount = 0, BillCount = 0 };
                        agingBuckets.Add(bucket);
                    }
                    bucket.Amount += days60;
                    bucket.BillCount += customerBills.Count(b =>
                        (b.Status ?? "").ToLower() != "paid" &&
                        (DateTime.UtcNow - b.BillDate).TotalDays > 30 &&
                        (DateTime.UtcNow - b.BillDate).TotalDays <= 60);
                }

                if (days90Plus > 0)
                {
                    var bucket = agingBuckets.FirstOrDefault(b => b.Label == "61+ ngày");
                    if (bucket == null)
                    {
                        bucket = new CustomerAgingBucket { Label = "61+ ngày", Amount = 0, BillCount = 0 };
                        agingBuckets.Add(bucket);
                    }
                    bucket.Amount += days90Plus;
                    bucket.BillCount += customerBills.Count(b =>
                        (b.Status ?? "").ToLower() != "paid" &&
                        (DateTime.UtcNow - b.BillDate).TotalDays > 60);
                }
            }

            // Sort aging buckets
            agingBuckets = agingBuckets.OrderBy(b => b.Label).ToList();

            // Sort top customers by outstanding amount
            topCustomers = topCustomers.OrderByDescending(c => c.Outstanding).Take(10).ToList();

            var avgDaysOutstanding = customerGroups.Any() ?
                customerGroups.Average(g => g.Where(b => (b.Status ?? "").ToLower() != "paid")
                                           .Average(b => (DateTime.UtcNow - b.BillDate).TotalDays)) : 0;

            return new CustomerAgingReportData
            {
                Summary = new CustomerAgingSummary
                {
                    TotalOutstanding = totalOutstanding,
                    TotalCollected = totalCollected,
                    CustomerCount = customerGroups.Count,
                    OverdueCount = overdueCount,
                    AvgDaysOutstanding = double.IsNaN(avgDaysOutstanding) ? 0 : avgDaysOutstanding
                },
                AgingBuckets = agingBuckets,
                TopCustomers = topCustomers
            };
        }
    }
}
