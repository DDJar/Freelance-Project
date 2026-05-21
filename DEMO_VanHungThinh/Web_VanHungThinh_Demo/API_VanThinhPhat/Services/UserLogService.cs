using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public class UserLogService : BaseRepository<UserLog>, IUserLogService
    {
        public UserLogService(IOptions<MongoDbSettings> settings, IMongoClient mongoClient)
            : base(settings, mongoClient, "userLogs")
        {
        }

        public async Task<List<UserLog>> GetAllAsync() =>
            await GetAsync();

        public async Task<UserLog?> GetByIdAsync(string id) =>
            await GetAsync(id);

        public override async Task<UserLog> CreateAsync(UserLog log)
        {
            log.Timestamp = DateTime.Now;
            await base.CreateAsync(log);
            return log;
        }

        public override async Task UpdateAsync(string id, UserLog log) =>
            await base.UpdateAsync(id, log);

        public override async Task DeleteAsync(string id) =>
            await base.DeleteAsync(id);
    }
}
