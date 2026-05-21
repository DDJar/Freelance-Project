
using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Text.Json;

namespace API_VanHungThinh.Services
{
    public class DepartmentService : BaseRepository<Department>, IDepartmentService
    {
        private readonly IDistributedCache _cache;

        public DepartmentService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient, IDistributedCache cache)
            : base(mongoDbSettings, mongoClient, "department")
        {
            _cache = cache;
        }

        public async Task<List<Department>> GetAllAsync()
        {
            const string cacheKey = "departments_all";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<List<Department>>(cachedData)!;
            }

            var departments = await _collection.Find(_ => true).ToListAsync();

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            };

            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(departments), cacheOptions);

            return departments;
        }

        public async Task<(List<Department>, long)> GetAllAsync(int page, int pageSize)
        {
            var totalCount = await _collection.CountDocumentsAsync(_ => true);
            var departments = await _collection.Find(_ => true)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();
            return (departments, totalCount);
        }

        public async Task<Department?> GetByIdAsync(string id) =>
            await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task<List<string>> GetPositionByDepartmentNameAsync(string departmentName)
        {
            var department = await _collection.Find(x => x.DepartmentName == departmentName).FirstOrDefaultAsync();
            return department?.Position ?? new List<string>();
        }

        public async Task<Department?> GetByDepartmentNameAsync(string departmentName) =>
            await _collection.Find(x => x.DepartmentName == departmentName).FirstOrDefaultAsync();

        public override async Task<Department> CreateAsync(Department department)
        {
            await _collection.InsertOneAsync(department);
            return department;
        }

        public override async Task UpdateAsync(string id, Department updatedDepartment) =>
            await _collection.ReplaceOneAsync(d => d.Id == id, updatedDepartment);

        public override async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(d => d.Id == id);
    }
}