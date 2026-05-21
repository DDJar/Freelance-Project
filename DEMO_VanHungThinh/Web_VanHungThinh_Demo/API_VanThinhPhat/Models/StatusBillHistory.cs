using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class StatusBillHistory
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("billId")]
        public string BillId { get; set; }

        [BsonElement("previousStatus")]
        public string? PreviousStatus { get; set; }

        [BsonElement("newStatus")]
        public string NewStatus { get; set; }

        [BsonElement("changedAt")]
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("changedBy")]
        public string? ChangedBy { get; set; }

        [BsonElement("notes")]
        public string? Notes { get; set; }

        [BsonElement("address")]
        public string? Address { get; set; }
    }
}
