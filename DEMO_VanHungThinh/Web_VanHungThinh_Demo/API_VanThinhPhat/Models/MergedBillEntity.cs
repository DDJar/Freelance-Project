using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace API_VanHungThinh.Models
{
    public class MergedBillEntity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("mergedBillNumber")]
        public string? MergedBillNumber { get; set; }

        [BsonElement("billIds")]
        public List<string> BillIds { get; set; } = new List<string>();

        [BsonElement("totalAmount")]
        public double TotalAmount { get; set; }

        [BsonElement("mergedDate")]
        public DateTime MergedDate { get; set; }

        [BsonElement("status")]
        public string? Status { get; set; }

        [BsonElement("notes")]
        public string? Notes { get; set; }

        [BsonElement("customerInfo")]
        public MergedBillCustomerInfo? CustomerInfo { get; set; }

        [BsonElement("createdBy")]
        public string? CreatedBy { get; set; }
    }

    public class MergedBillCustomerInfo
    {
        [BsonElement("email")]
        public string? Email { get; set; }

        [BsonElement("firstName")]
        public string? FirstName { get; set; }

        [BsonElement("lastName")]
        public string? LastName { get; set; }

        [BsonElement("phone")]
        public string? Phone { get; set; }

        [BsonElement("address")]
        public string? Address { get; set; }
    }
}