using MongoDB.Driver;

namespace API_VanHungThinh
{
    internal class MongoDBSettings
    {
        public MongoClientSettings ConnectionString { get; internal set; }
        public string DatabaseName { get; internal set; }
    }
}