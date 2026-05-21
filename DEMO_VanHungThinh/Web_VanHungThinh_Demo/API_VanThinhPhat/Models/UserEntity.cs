// Models/User.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class User
    {
        [BsonId]
        [BsonElement("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("username")]
        public string? Username { get; set; }

        [BsonElement("password")]
        public string? Password { get; set; }

        [BsonElement("firstname")]
        public string? Firstname { get; set; }

        [BsonElement("lastname")]
        public string? Lastname { get; set; }

        [BsonElement("phoneNumber")]
        public string? PhoneNumber { get; set; }

        [BsonElement("address")]
        public string? Address { get; set; }

        [BsonElement("gender")]
        public string? Gender { get; set; }

        [BsonElement("position")]
        public string? Position { get; set; }

        [BsonElement("departmentId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? DepartmentId { get; set; }

        [BsonElement("email")]
        public string? Email { get; set; }

        [BsonElement("role")]
        public string? Role { get; set; }

        [BsonElement("status")]
        public string? Status { get; set; }


        [BsonElement("country")]
        public string? Country { get; set; }


        [BsonElement("city")]
        public string? City { get; set; }

        [BsonElement("avatarUrl")]
        public string? avatarUrl { get; set; }


        [BsonElement("hiredDate")]
        public string? HiredDate { get; set; }

        [BsonElement("birthDate")]
        public string? BirthDate { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    }

    public class UserReference
    {
        [BsonElement("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("username")]
        public string? Username { get; set; }

    }

    public class ChangePasswordRequest
    {
        public string? CurrentPassword { get; set; }
        public string? NewPassword { get; set; }
    }
}

