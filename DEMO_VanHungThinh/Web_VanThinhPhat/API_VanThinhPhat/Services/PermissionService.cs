using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

public class PermissionService : IPermissionService
{
    private readonly IMongoCollection<Permission> _collection;

    public PermissionService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient)
    {
        var database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
        _collection = database.GetCollection<Permission>("permissions");
    }

    public async Task<List<Permission>> GetAllAsync() => await _collection.Find(_ => true).ToListAsync();

    public async Task<Permission?> GetByRoleAsync(string role) => await _collection.Find(p => p.Role == role).FirstOrDefaultAsync();

    public async Task<Permission> CreateOrUpdateAsync(Permission permission)
    {
        if (string.IsNullOrEmpty(permission.Id))
        {
            permission.UpdatedAt = System.DateTime.UtcNow;
            await _collection.InsertOneAsync(permission);
            return permission;
        }

        permission.UpdatedAt = System.DateTime.UtcNow;
        await _collection.ReplaceOneAsync(p => p.Id == permission.Id, permission, new ReplaceOptions { IsUpsert = true });
        return permission;
    }

    public async Task DeleteAsync(string id) => await _collection.DeleteOneAsync(p => p.Id == id);
}
