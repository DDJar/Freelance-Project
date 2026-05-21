using API_VanHungThinh.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_VanHungThinh.Services.Interface
{
    public interface ITaskService
    {
        Task<List<Tasks>> GetAllAsync();
        Task<Tasks> GetByIdAsync(string id);
        Task<Tasks> CreateAsync(Tasks task);
        Task UpdateAsync(string id, Tasks task);
        Task DeleteAsync(string id);
    }
}
