using API_VanHungThinh.Models;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IProductPriceByCustomerTypeService _priceService;
        private readonly INotificationService _notificationService;

        public ProductController(IProductService productService, IProductPriceByCustomerTypeService priceService, INotificationService notificationService)
        {
            _productService = productService;
            _priceService = priceService;
            _notificationService = notificationService;
        }


        [HttpGet]
        public async Task<ActionResult<object>> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? search = null,
            [FromQuery] string? categories = null,
            [FromQuery] string? brands = null,
            [FromQuery] string? status = null,
            [FromQuery] double? maxPrice = null,
            [FromQuery] string? sort = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 1000) pageSize = 50;

            var categoryList = string.IsNullOrWhiteSpace(categories)
                ? null
                : categories.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

            var brandList = string.IsNullOrWhiteSpace(brands)
                ? null
                : brands.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

            var statusList = string.IsNullOrWhiteSpace(status)
                ? null
                : status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

            var (products, totalCount) = await _productService.GetPagedAsync(
                page,
                pageSize,
                search,
                categoryList,
                brandList,
                statusList,
                maxPrice,
                sort);

            return Ok(new {
                data = products,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("categories")]
        public async Task<ActionResult<List<object>>> GetCategories()
        {
            var categories = await _productService.GetCategoriesWithCountsAsync();
            var result = categories.Select(c => new { category = c.Category, count = c.Count }).ToList();
            return Ok(result);
        }

        [HttpGet("filter-counts")]
        public async Task<ActionResult<object>> GetFilterCounts()
        {
            var categories = await _productService.GetCategoriesWithCountsAsync();
            var brands = await _productService.GetBrandsWithCountsAsync();
            var statuses = await _productService.GetStatusesWithCountsAsync();

            var result = new
            {
                categories = categories.Select(c => new { category = c.Category, count = c.Count }).ToList(),
                brands = brands.Select(b => new { brand = b.Brand, count = b.Count }).ToList(),
                statuses = statuses.Select(s => new { status = s.Status, count = s.Count }).ToList()
            };

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductEntity>> GetById(string id)
        {
            var product = await _productService.GetAsync(id);
            if (product == null)
                return NotFound("Product not found");

            return Ok(product);
        }

        
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductEntity product)
        {
            await _productService.CreateAsync(product);
            await _notificationService.NotifyCreated(EntityType.Product, product.Id ?? "", product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] ProductEntity updatedProduct)
        {
            var existingProduct = await _productService.GetAsync(id);
            if (existingProduct == null)
                return NotFound("Product not found");

            updatedProduct.Id = id;
            await _productService.UpdateAsync(id, updatedProduct);
            await _notificationService.NotifyUpdated(EntityType.Product, id, updatedProduct);
            return NoContent();
        }

        
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var product = await _productService.GetAsync(id);
            if (product == null)
                return NotFound("Product not found");

            await _productService.DeleteAsync(id);
            await _notificationService.NotifyDeleted(EntityType.Product, id);
            return NoContent();
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<object>>> Search([FromQuery] string? id, [FromQuery] string? name, [FromQuery] string? category, [FromQuery] string? customerType)
        {
            var products = await _productService.GetSearchAsync(id, name, category);
            var result = new List<object>();

            // Batch fetch prices to avoid N+1 queries
            Dictionary<string, double>? priceMap = null;
            if (!string.IsNullOrEmpty(customerType))
            {
                var productIds = products.Select(p => p.Id).ToList();
                var prices = await _priceService.GetPricesAsync(productIds, customerType);
                priceMap = prices.ToDictionary(p => p.ProductId, p => p.Price);
            }

            foreach (var product in products)
            {
                double price = product.Price;
                if (priceMap != null && priceMap.TryGetValue(product.Id, out var customPrice))
                {
                    price = customPrice;
                }
                result.Add(new {
                    product.Id,
                    product.Name,
                    product.ProductCode,
                    product.Category,
                    product.Quantity,
                    product.Unit,
                    Price = price,
                    product.Description,
                    ImageUrl = product.ImageUrl ?? product.ImageUrls?.FirstOrDefault(),
                    ImageUrls = product.ImageUrls,
                    product.idDepartment
                });
            }
            return Ok(result);
        }

        [HttpGet("prices")]
        public async Task<IActionResult> GetPrices([FromQuery] string? ids, [FromQuery] string? customerType)
        {
            if (string.IsNullOrWhiteSpace(ids))
                return BadRequest(new { message = "Missing product ids." });

            if (string.IsNullOrWhiteSpace(customerType))
                return BadRequest(new { message = "Missing customer type." });

            var productIds = ids
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct()
                .ToList();

            if (!productIds.Any())
                return BadRequest(new { message = "Missing product ids." });

            var prices = await _priceService.GetPricesAsync(productIds, customerType);
            var result = prices.Select(price => new
            {
                productId = price.ProductId,
                price = price.Price
            });

            return Ok(result);
        }

        ///  Cập nhật số lượng tồn kho và ghi lịch sử

        [HttpPost("update-inventory")]
        public async Task<IActionResult> UpdateInventory([FromBody] UpdateInventoryRequest request)
        {
            var result = await _productService.UpdateInventoryAndLogAsync(
                request.ProductId,
                request.QuantityChanged);

            if (!result)
                return NotFound("Product not found");

            return Ok("Inventory updated successfully");
        }
        ///  Lấy lịch sử thay đổi tồn kho của sản phẩm

        [HttpGet("{productId}/inventory-history")]
        public async Task<IActionResult> GetInventoryHistory(string productId)
        {
            var history = await _productService.GetInventoryHistoryByProductIdAsync(productId);
            return Ok(history);
        }
        [HttpGet("inventory-report")]
        public async Task<IActionResult> GetInventoryReport(
    [FromQuery] DateTime? fromDate,
    [FromQuery] DateTime? toDate,
    [FromQuery] string? departmentId,
    [FromQuery] string? actionType,
    [FromQuery] string groupBy = "daily")
        {
            var filter = new InventoryReportFilter
            {
                FromDate = fromDate,
                ToDate = toDate,
                DepartmentId = departmentId,
                ActionType = actionType,
                GroupBy = groupBy
            };

            var report = await _productService.GetInventoryReportAsync(filter);
            return Ok(report);
        }

        [HttpGet("{id}/price-by-customer-type")]
        public async Task<IActionResult> GetPriceByCustomerType(string id, [FromQuery] string customerType)
        {
            var product = await _productService.GetAsync(id);
            if (product == null)
                return NotFound("Product not found");
            var priceInfo = await _priceService.GetPriceAsync(id, customerType);
            if (priceInfo == null)
                return NotFound($"No price found for customer type: {customerType}");
            return Ok(priceInfo.Price);
        }

    }
}

