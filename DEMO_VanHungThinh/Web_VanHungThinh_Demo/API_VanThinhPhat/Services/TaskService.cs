using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_VanHungThinh.Services
{
    public class TaskService : BaseRepository<Tasks>, ITaskService
    {
        public TaskService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient)
            : base(mongoDbSettings, mongoClient, "tasks")
        {
        }

        public async Task<List<Tasks>> GetAllAsync() =>
            await GetAsync();

        public async Task<Tasks> GetByIdAsync(string id) =>
            await GetAsync(id);

        public override async Task<Tasks> CreateAsync(Tasks task)
        {
            await base.CreateAsync(task);

            var taskRef = new TaskReference
            {
                Id = task.Id,
                Title = task.Title
            };

            return task;
        }

        public override async Task UpdateAsync(string id, Tasks updatedTask)
        {
            var existingTask = await GetAsync(id);
            if (existingTask == null) return;

            var taskRef = new TaskReference
            {
                Id = updatedTask.Id,
                Title = updatedTask.Title
            };

            // Nếu priority thay đổi

            await base.UpdateAsync(id, updatedTask);
        }

        public override async Task DeleteAsync(string id)
        {
            var task = await GetAsync(id);
            if (task == null) return;
            await base.DeleteAsync(id);
        }
    }
}
