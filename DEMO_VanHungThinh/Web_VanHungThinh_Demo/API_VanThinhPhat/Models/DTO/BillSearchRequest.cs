using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace API_VanHungThinh.Models.DTO
{
    public class BillSearchRequest
    {
        public double? MinTotalAmount { get; set; }
        public double? MaxTotalAmount { get; set; }
        public string? TimeRange { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Status { get; set; }
    }
    public class BillItemWithProductNameDTO
    {
        public string? Id { get; set; }
        public string? BillId { get; set; }
        public string ProductId { get; set; }
        public string ProductName { get; set; }
        public string? ProductCode { get; set; }
        public string? Unit { get; set; }
        public string? Category { get; set; }
        public string? ImageUrl { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
        public double Total { get; set; }
    }
    public class BillDetailsDTO
    {
        public BillEntity Bill { get; set; }
        public List<BillItemWithProductNameDTO> Items { get; set; } = new();
        public double TotalAmount { get; set; }
    }
    public class CreateBillItemRequest
    {
        public string Id { get; set; }
        public string ProductId { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
        public double Total { get; set; }
    }
    public class OrderEmailRequest
    {
        public string ToEmail { get; set; }
        public string CustomerName { get; set; }
        public string OrderDetails { get; set; }
    }
    public class UpdateBillStatusRequest
    {
        [Required(ErrorMessage = "NewStatus is required")]
        [JsonPropertyName("newStatus")]
        public string NewStatus { get; set; }
        public string NewAddress { get; set; }
    }

    public class UpdateBillRequest
    {
        public string? IdentifyNumber { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public DateTime? InvoiceDueDate { get; set; }
        public double? TaxAmount { get; set; }
        public double? DiscountAmount { get; set; }
        public string? InvoiceStatus { get; set; }
        public string? InvoiceNotes { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Status { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public double? TotalAmount { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }
}
