using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class Delivery
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("billId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string BillId { get; set; }

        [BsonElement("deliveryDate")]
        public DateTime DeliveryDate { get; set; }

        [BsonElement("deliveredBy")]
        public string DeliveredBy { get; set; }

        [BsonElement("recipient")]
        public string Recipient { get; set; }

        [BsonElement("status")]
        public string Status { get; set; }

        [BsonElement("notes")]
        public string Notes { get; set; }
    }
}
