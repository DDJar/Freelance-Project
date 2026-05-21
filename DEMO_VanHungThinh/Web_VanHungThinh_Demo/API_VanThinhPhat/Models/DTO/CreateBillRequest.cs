using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models.DTO
{
    public class CreateBillRequest
    {
        public string? IdentifyNumber { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public DateTime? InvoiceDueDate { get; set; }
        public double TaxAmount { get; set; }
        public double DiscountAmount { get; set; }
        public string? InvoiceStatus { get; set; }
        public string? InvoiceNotes { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public double TotalAmount { get; set; }
        //public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Status { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public List<ShoppingCartItemDTO>? Items { get; set; }
        public string? CustomerType { get; set; } // Thêm trường loại khách hàng
    }
    public class BillWithItemsDTO
    {
        public string? Id { get; set; }
        public string? IdentifyNumber { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public DateTime BillDate { get; set; }
        public string? Status { get; set; }
        public double TotalAmount { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }

        public string? InvoiceNumber { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public DateTime? InvoiceDueDate { get; set; }
        public double TaxAmount { get; set; }
        public double DiscountAmount { get; set; }
        public string? InvoiceStatus { get; set; }
        public string? InvoiceNotes { get; set; }
        public List<ShoppingCartItemDTO2>? Items { get; set; }
    }
    public class ShoppingCartItemDTO2
    {
        public string? ProductId { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
        public double Total { get; set; }
    }


}
