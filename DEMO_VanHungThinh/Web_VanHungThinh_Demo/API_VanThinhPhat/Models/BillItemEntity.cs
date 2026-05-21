using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class BillItemEntity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("billId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? BillId { get; set; }

        [BsonElement("productId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ProductId { get; set; }

        [BsonElement("quantity")]
        public int Quantity { get; set; }

        [BsonElement("price")]
        public double Price { get; set; }

        [BsonElement("total")]
        public double Total { get; set; }
    }
    public class BillItemEntityRequest
    {

        [BsonElement("billId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? BillId { get; set; }

        [BsonElement("productId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ProductId { get; set; }

        [BsonElement("quantity")]
        public int Quantity { get; set; }

        [BsonElement("price")]
        public double Price { get; set; }
        [BsonElement("total")]
        public double Total { get; set; }
    }
}
