using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Services;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductPriceByCustomerTypeController : ControllerBase
    {
        private readonly IProductPriceByCustomerTypeService _priceService;
        public ProductPriceByCustomerTypeController(IProductPriceByCustomerTypeService priceService)
        {
            _priceService = priceService;
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetPricesByProductId(string productId)
        {
            var prices = await _priceService.GetPricesByProductIdAsync(productId);
            return Ok(prices);
        }

        [HttpGet("product/{productId}/customer-type/{customerType}")]
        public async Task<IActionResult> GetPrice(string productId, string customerType)
        {
            var price = await _priceService.GetPriceAsync(productId, customerType);
            if (price == null)
                return NotFound();
            return Ok(price);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrUpdatePrice([FromBody] ProductPriceByCustomerTypeEntity price)
        {
            await _priceService.CreateOrUpdatePriceAsync(price);
            return Ok();
        }

        [HttpDelete]
        public async Task<IActionResult> DeletePrice([FromQuery] string productId, [FromQuery] string customerType)
        {
            await _priceService.DeletePriceAsync(productId, customerType);
            return Ok();
        }

        // GET: api/ProductPriceByCustomerType/customer-types
        [HttpGet("customer-types")]
        public async Task<IActionResult> GetDistinctCustomerTypes()
        {
            var customerTypes = await _priceService.GetAllCustomerTypesAsync();
            return Ok(customerTypes);
        }
    }
}
