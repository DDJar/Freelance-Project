using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace API_VanHungThinh.Models
{
    public class ProjectSettings
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Use a single document keyed by "global" or similar
        [BsonElement("key")]
        public string? Key { get; set; }

        [BsonElement("values")]
        public Dictionary<string, string> Values { get; set; } = new Dictionary<string, string>();

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
