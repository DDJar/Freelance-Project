using API_VanHungThinh.Models;
using Microsoft.AspNetCore.Identity;

public interface IUserService
{
    Task<User> RegisterAsync(RegisterRequest request, IPasswordHasher<User> passwordHasher);
    Task<User?> LoginAsync(string email, string password, IPasswordHasher<User> passwordHasher);
    Task<List<User>> GetAllAsync();
    Task<(List<User>, long)> GetAllAsync(int page, int pageSize);
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User> CreateAsync(User user, string password);
    Task UpdateAsync(string id, User user);
    Task DeleteAsync(string id);
    Task<(bool Success, string Message)> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    Task<List<Department>> GetAllDepartmentsAsync();
    Task<List<string>> GetBusinessesByDepartmentAsync(string departmentId);
}