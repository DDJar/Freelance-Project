using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class RefreshToken
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("userId")]
        public string UserId { get; set; } = null!;

        [BsonElement("tokenHash")]
        public string TokenHash { get; set; } = null!;

        [BsonElement("deviceId")]
        public string? DeviceId { get; set; }

        [BsonElement("userAgent")]
        public string? UserAgent { get; set; }

        [BsonElement("ip")]
        public string? Ip { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        [BsonElement("expiresAt")]
        public DateTime ExpiresAt { get; set; }

        [BsonElement("revoked")]
        public bool Revoked { get; set; } = false;

        [BsonElement("replacedByTokenHash")]
        public string? ReplacedByTokenHash { get; set; }
    }
}