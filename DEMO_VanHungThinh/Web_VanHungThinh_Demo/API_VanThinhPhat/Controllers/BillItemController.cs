using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillItemController : ControllerBase
    {
        private readonly IBillItemService _billItemService;

        public BillItemController(IBillItemService billItemService)
        {
            _billItemService = billItemService;
        }

        // POST: api/BillItem
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BillItemEntityRequest newItem)
        {
            if (string.IsNullOrEmpty(newItem.BillId))
            {
                newItem.BillId = "";
            }
            try
            {
                var result = await _billItemService.CreateAsync(newItem);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (ArgumentException aex)
            {
                return BadRequest(new { message = aex.Message });
            }
            catch (Exception ex)
            {
                // Unexpected errors -> return 500 with minimal detail
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/BillItem
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _billItemService.GetAllAsync();
            return Ok(items);
        }

        // GET: api/BillItem/{id}
        [HttpGet("{id:length(24)}")]
        public async Task<IActionResult> GetById(string id)
        {
            var item = await _billItemService.GetByIdAsync(id);
            return item == null ? NotFound() : Ok(item);
        }

        [HttpPut("{id:length(24)}")]
        public async Task<IActionResult> Update(string id, [FromBody] BillItemEntity updatedItem)
        {
            
            var existingItem = await _billItemService.GetByIdAsync(id);
            if (existingItem == null)
                return NotFound(new { message = "Bill item not found" });

            var success = await _billItemService.UpdateAsync(id, updatedItem);

            if (success)
                return Ok(new { message = "Cập nhật thành công", data = updatedItem });

            return StatusCode(500, new { message = "Cập nhật thất bại" });
        }



        // DELETE: api/BillItem/{id}
        [HttpDelete("{id:length(24)}")]
        public async Task<IActionResult> Delete(string id)
        {
            var exists = await _billItemService.GetByIdAsync(id);
            if (exists == null)
                return NotFound();

            var result = await _billItemService.DeleteAsync(id);
            return result ? NoContent() : StatusCode(500, "Xóa thất bại");
        }

        // GET: api/BillItem/with-product/by-bill/{billId}
        [HttpGet("with-product/by-bill/{billId}")]
        public async Task<IActionResult> GetItemsWithProductByBillId(string billId)
        {
            var itemsWithProduct = await _billItemService.GetItemsWithProductByBillIdAsync(billId);

            if (itemsWithProduct == null || !itemsWithProduct.Any())
                return NotFound(new { message = "Không tìm thấy sản phẩm nào cho billId đã cho." });

            // Trả về kết quả rõ ràng hơn
            var result = itemsWithProduct.Select(x => new
            {
                BillItemEntity = x.Item,
                ProductEntity = x.Product
            });

            return Ok(result);
        }

    }
}
