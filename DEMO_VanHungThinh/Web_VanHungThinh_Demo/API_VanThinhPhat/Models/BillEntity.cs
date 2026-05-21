using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class BillEntity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("identifyNumber")]
        public string? IdentifyNumber { get; set; }

        [BsonElement("totalAmount")]
        public double TotalAmount { get; set; }

        [BsonElement("invoiceNumber")]
        public string? InvoiceNumber { get; set; }

        [BsonElement("invoiceDate")]
        public DateTime? InvoiceDate { get; set; }

        [BsonElement("invoiceDueDate")]
        public DateTime? InvoiceDueDate { get; set; }

        [BsonElement("taxAmount")]
        public double TaxAmount { get; set; }

        [BsonElement("discountAmount")]
        public double DiscountAmount { get; set; }

        [BsonElement("invoiceStatus")]
        public string? InvoiceStatus { get; set; }

        [BsonElement("invoiceNotes")]
        public string? InvoiceNotes { get; set; }

        [BsonElement("billDate")]
        public DateTime BillDate { get; set; }

        [BsonElement("paymentMethod")]
        public string? PaymentMethod { get; set; }
        [BsonElement("status")]
        public string? Status { get; set; }
        [BsonElement("notes")]
        public string? Notes { get; set; }
        [BsonElement("email")]
        public string? Email { get; set; }
        [BsonElement("firstName")]
        public string? FirstName { get; set; }
        [BsonElement("lastName")]
        public string? LastName { get; set; }


        [BsonElement("dateOfBirth")]
        public DateTime DateOfBirth { get; set; }

        [BsonElement("phone")]
        public string? Phone { get; set; }


        [BsonElement("address")]
        public string? Address { get; set; }
    }

    

}
