    using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace API_VanHungThinh.Models
{
    public class Tasks
    {
        [BsonId]
        [BsonElement("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("title")]
        public string? Title { get; set; }

        [BsonElement("company")]
        public string? Company { get; set; }

        [BsonElement("assignedTo")]
        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> AssignedTo { get; set; } = new List<string>();

        [BsonElement("departmentId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? DepartmentId { get; set; }

        [BsonElement("priority")]
        public string? Priority { get; set; } 

        [BsonElement("status")]
        public string? Status { get; set; }

        [BsonElement("startDate")]
        public DateTime StartDate { get; set; }

        [BsonElement("dueDate")]
        public DateTime DueDate { get; set; } 

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        [BsonElement("detail")]
        public string? Detail { get; set; }

        [BsonElement("estimatedHour")]
        public int? EstimatedHour { get; set; }

        [BsonElement("completedAt")]
        public DateTime? CompletedAt { get; set; }

        [BsonElement("result")]
        public string? Result { get; set; }

    }

    public class TaskReference
    {
        [BsonElement("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("title")]
        public string? Title { get; set; }

    }
}
