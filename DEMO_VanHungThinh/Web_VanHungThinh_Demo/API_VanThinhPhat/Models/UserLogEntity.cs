using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace API_VanHungThinh.Models
{
    public class UserLog
    {
        [BsonId]
        [BsonElement("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("userId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? UserId { get; set; }

        [BsonElement("action")]
        public string? Action { get; set; }

        [BsonElement("timestamp")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Local)]
        public DateTime Timestamp { get; set; } = DateTime.Now;

        [BsonElement("metadata")]
        public object Metadata { get; set; } = new { };
    }
}

