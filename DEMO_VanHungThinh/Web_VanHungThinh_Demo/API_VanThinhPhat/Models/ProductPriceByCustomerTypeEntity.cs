using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class ProductPriceByCustomerTypeEntity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("productId")]
        public string ProductId { get; set; } = null!;

        [BsonElement("customerType")]
        public string CustomerType { get; set; } = null!; // gara, si, le, etc

        [BsonElement("price")]
        public double Price { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
