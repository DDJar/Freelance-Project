using API_VanHungThinh.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
public class Department
{
    [BsonId]
    [BsonElement("_id")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("departmentName")]
    public string? DepartmentName { get; set; }

    [BsonElement("position")]
    public List<string> Position { get; set; } = new List<string>();

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("user")]
    public List<UserReference> user { get; set; } = new List<UserReference>();

}
