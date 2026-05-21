using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface IUserLogService
    {
        Task<List<UserLog>> GetAllAsync();
        Task<UserLog?> GetByIdAsync(string id);
        Task<UserLog> CreateAsync(UserLog log);
        Task UpdateAsync(string id, UserLog log);
        Task DeleteAsync(string id);
    }
}
