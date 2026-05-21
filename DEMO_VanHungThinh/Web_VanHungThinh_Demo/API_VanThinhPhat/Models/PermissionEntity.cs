using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace API_VanHungThinh.Models
{
    public class Permission
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("role")]
        public string? Role { get; set; }


        [BsonElement("features")]
        public List<string> Features { get; set; } = new List<string>();

        // Thêm property lưu chuỗi các path menu
        [BsonElement("paths")]
        [Newtonsoft.Json.JsonProperty("paths")]
        public string? Paths { get; set; }

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
