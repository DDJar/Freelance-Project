using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Threading.Tasks;

namespace API_VanHungThinh.Services
{
    public class SettingsService : BaseRepository<ProjectSettings>, ISettingsService
    {
        public SettingsService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient)
            : base(mongoDbSettings, mongoClient, "project_settings")
        {
        }

        public override async Task<ProjectSettings?> GetAsync(string key = "global")
        {
            return await _collection.Find(s => s.Key == key).FirstOrDefaultAsync();
        }

        public async Task<ProjectSettings> UpsertAsync(ProjectSettings settings)
        {
            settings.UpdatedAt = System.DateTime.UtcNow;
            if (string.IsNullOrEmpty(settings.Id))
            {
                await base.CreateAsync(settings);
                return settings;
            }

            await _collection.ReplaceOneAsync(s => s.Id == settings.Id, settings, new ReplaceOptions { IsUpsert = true });
            return settings;
        }
    }
}
