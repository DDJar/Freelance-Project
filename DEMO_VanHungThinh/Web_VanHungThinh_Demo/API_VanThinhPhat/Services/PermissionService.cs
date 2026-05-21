using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_VanHungThinh.Services
{
    public class PermissionService : BaseRepository<Permission>, IPermissionService
    {
        public PermissionService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient)
            : base(mongoDbSettings, mongoClient, "permissions")
        {
        }

        public async Task<List<Permission>> GetAllAsync() =>
            await GetAsync();

        public async Task<Permission?> GetByRoleAsync(string role) =>
            await _collection.Find(p => p.Role == role).FirstOrDefaultAsync();

        public override async Task<Permission> CreateAsync(Permission permission)
        {
            permission.UpdatedAt = System.DateTime.UtcNow;
            await _collection.InsertOneAsync(permission);
            return permission;
        }

        public async Task<Permission> UpdateAsync(Permission permission)
        {
            permission.UpdatedAt = System.DateTime.UtcNow;
            await _collection.ReplaceOneAsync(p => p.Id == permission.Id, permission, new ReplaceOptions { IsUpsert = false });
            return permission;
        }

        public override async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(p => p.Id == id);
    }
}
