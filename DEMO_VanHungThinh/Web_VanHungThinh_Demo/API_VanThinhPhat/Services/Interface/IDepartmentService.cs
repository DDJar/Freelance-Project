using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface IDepartmentService
    {
        Task<List<Department>> GetAllAsync();
        Task<(List<Department>, long)> GetAllAsync(int page, int pageSize);
        Task<Department?> GetByIdAsync(string id);
        Task<Department?> GetByDepartmentNameAsync(string departmentName);
        Task<Department> CreateAsync(Department department);
        Task UpdateAsync(string id, Department updatedDepartment);
        Task DeleteAsync(string id);
        Task<List<string>> GetPositionByDepartmentNameAsync(string departmentName);
    }
}


