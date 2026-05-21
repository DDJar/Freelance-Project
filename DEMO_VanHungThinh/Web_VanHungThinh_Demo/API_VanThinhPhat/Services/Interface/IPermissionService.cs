using API_VanHungThinh.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IPermissionService
{
    Task<List<Permission>> GetAllAsync();
    Task<Permission?> GetByRoleAsync(string role);
    Task<Permission> CreateAsync(Permission permission);
    Task<Permission> UpdateAsync(Permission permission);
    Task DeleteAsync(string id);
}
