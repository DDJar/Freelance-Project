using API_VanHungThinh.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public abstract class BaseRepository<T> where T : class
    {
        protected readonly IMongoCollection<T> _collection;

        protected BaseRepository(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient, string collectionName)
        {
            var database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
            _collection = database.GetCollection<T>(collectionName);
        }

        public virtual async Task<List<T>> GetAsync() =>
            await _collection.Find(_ => true).ToListAsync();

        public virtual async Task<(List<T>, long)> GetAsync(int page, int pageSize)
        {
            var totalCount = await _collection.CountDocumentsAsync(_ => true);
            var items = await _collection.Find(_ => true)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();
            return (items, totalCount);
        }

        public virtual async Task<T?> GetAsync(string id) =>
            await _collection.Find(Builders<T>.Filter.Eq("Id", id)).FirstOrDefaultAsync();

        public virtual async Task CreateAsync(T entity)
        {
            // Set CreatedAt and UpdatedAt if entity has these properties
            var createdAtProperty = typeof(T).GetProperty("CreatedAt");
            var updatedAtProperty = typeof(T).GetProperty("UpdatedAt");

            if (createdAtProperty != null && updatedAtProperty != null)
            {
                var now = DateTime.UtcNow;
                createdAtProperty.SetValue(entity, now);
                updatedAtProperty.SetValue(entity, now);
            }

            await _collection.InsertOneAsync(entity);
        }

        public virtual async Task UpdateAsync(string id, T updatedEntity)
        {
            // Set UpdatedAt if entity has this property
            var updatedAtProperty = typeof(T).GetProperty("UpdatedAt");
            if (updatedAtProperty != null)
            {
                updatedAtProperty.SetValue(updatedEntity, DateTime.UtcNow);
            }

            await _collection.ReplaceOneAsync(Builders<T>.Filter.Eq("Id", id), updatedEntity);
        }

        public virtual async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(Builders<T>.Filter.Eq("Id", id));
    }
}