using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public class UserService : BaseRepository<User>, IUserService
    {
        private readonly IMongoCollection<Department> _departmentsCollection;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IUserLogService _logService;

    public UserService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient, IPasswordHasher<User> passwordHasher, IUserLogService logService)
        : base(mongoDbSettings, mongoClient, "user")
    {
        var database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
        _departmentsCollection = database.GetCollection<Department>("department");
        _passwordHasher = passwordHasher; // Fixed: assign the parameter
        _logService = logService;
    }

    // Validate department và business có match với nhau không
    private async Task<bool> ValidateDepartmentAndBusiness(string departmentId, string position)
    {
        if (string.IsNullOrEmpty(departmentId) || string.IsNullOrEmpty(position))
            return false;

        var department = await _departmentsCollection
            .Find(d => d.Id == departmentId && d.Position.Contains(position))
            .FirstOrDefaultAsync();

        return department != null;
    }

    // Validate department có tồn tại không
    private async Task<bool> ValidateDepartmentExists(string departmentId)
    {
        if (string.IsNullOrEmpty(departmentId)) return false;

        var department = await _departmentsCollection
            .Find(d => d.Id == departmentId)
            .FirstOrDefaultAsync();

        return department != null;
    }

    public async Task<User> RegisterAsync(RegisterRequest request, IPasswordHasher<User> passwordHasher)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Username and password are required.");

        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("Email is required.");

        // Check if username already exists
        var existingUser = await GetByUsernameAsync(request.Username);
        if (existingUser != null)
            throw new InvalidOperationException("Username already exists.");

        // Check if email already exists
        var existingEmail = await _collection
            .Find(u => u.Email == request.Email)
            .FirstOrDefaultAsync();
        if (existingEmail != null)
            throw new InvalidOperationException("Email already exists.");

        var newUser = new User
        {
            Username = request.Username,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Gender = request.Gender,
            Address = request.Address,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Hash password
        newUser.Password = passwordHasher.HashPassword(newUser, request.Password);

        try
        {
            await _collection.InsertOneAsync(newUser);

            // Add user reference to department
            if (!string.IsNullOrEmpty(newUser.DepartmentId))
            {
                var userRef = new UserReference
                {
                    Id = newUser.Id,
                    Username = newUser.Username
                };

                var update = Builders<Department>.Update.Push(d => d.user, userRef);
                await _departmentsCollection.UpdateOneAsync(
                    d => d.Id == newUser.DepartmentId,
                    update
                );
            }

            await _logService.CreateAsync(new UserLog
            {
                UserId = newUser.Id,
                Action = "Register",
                Metadata = new { newUser.Username, newUser.Email, newUser.Position, newUser.DepartmentId }
            });

            return newUser;
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to register user: {ex.Message}", ex);
        }
    }

    public async Task<User?> LoginAsync(string email, string password, IPasswordHasher<User> passwordHasher)
    {
        var user = await _collection
            .Find(x => x.Email == email)
            .FirstOrDefaultAsync();

        if (user == null || string.IsNullOrEmpty(user.Password))
            return null;

        var result = passwordHasher.VerifyHashedPassword(user, user.Password, password);

        if (result == PasswordVerificationResult.Success ||
            result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            await _logService.CreateAsync(new UserLog
            {
                UserId = user.Id,
                Action = "Login",
                Metadata = new { user.Username, user.Email, LoginTime = DateTime.UtcNow }
            });

            return user;
        }
        return null;
    }

    public async Task<List<User>> GetAllAsync() =>
        await _collection.Find(_ => true).ToListAsync();

    public async Task<(List<User>, long)> GetAllAsync(int page, int pageSize)
    {
        var totalCount = await _collection.CountDocumentsAsync(_ => true);
        var users = await _collection.Find(_ => true)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
        return (users, totalCount);
    }

    public async Task<User?> GetByIdAsync(string id) =>
        await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<User?> GetByUsernameAsync(string username) =>
        await _collection.Find(x => x.Username == username).FirstOrDefaultAsync();
    public async Task<User> CreateAsync(User user, string password)
    {
        bool hasDepartment = !string.IsNullOrEmpty(user.DepartmentId);
        bool hasPosition = !string.IsNullOrEmpty(user.Position);

        if (hasDepartment && hasPosition)
        {
            var departmentExists = await ValidateDepartmentExists(user.DepartmentId);
            if (!departmentExists)
                throw new ArgumentException("Selected department does not exist.");

            var isValidCombination = await ValidateDepartmentAndBusiness(user.DepartmentId, user.Position);
            if (!isValidCombination)
                throw new ArgumentException($"Business '{user.Position}' does not belong to the selected department.");
        }
        else if (hasDepartment || hasPosition)
        {
            throw new ArgumentException("Both Department and Position must be provided together.");
        }

        // ✅ Hash password from input string
        if (!string.IsNullOrEmpty(password))
        {
            user.Password = _passwordHasher.HashPassword(user, password);
        }

        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _collection.InsertOneAsync(user);

        if (hasDepartment && hasPosition)
        {
            var userRef = new UserReference
            {
                Id = user.Id,
                Username = user.Username
            };

            var updateDept = Builders<Department>.Update.Push(d => d.user, userRef);
            await _departmentsCollection.UpdateOneAsync(d => d.Id == user.DepartmentId, updateDept);
        }

        await _logService.CreateAsync(new UserLog
        {
            UserId = user.Id,
            Action = "CreateUser",
            Metadata = new
            {
                user.Username,
                user.Email,
                user.Position,
                user.DepartmentId
            }
        });

        return user;
    }




    public override async Task UpdateAsync(string id, User updatedUser)
    {
        var existingUser = await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (existingUser == null)
            throw new Exception("User not found.");

        // Validate department và business (cả hai đều bắt buộc nếu có update)
        if (!string.IsNullOrEmpty(updatedUser.DepartmentId) || !string.IsNullOrEmpty(updatedUser.Position))
        {
            if (string.IsNullOrEmpty(updatedUser.DepartmentId))
                throw new ArgumentException("Department is required.");

            if (string.IsNullOrEmpty(updatedUser.Position))
                throw new ArgumentException("Business is required.");

            // Kiểm tra department có tồn tại không
            var departmentExists = await ValidateDepartmentExists(updatedUser.DepartmentId);
            if (!departmentExists)
                throw new ArgumentException("Selected department does not exist.");

            // Kiểm tra business có thuộc department được chọn không
            var isValidCombination = await ValidateDepartmentAndBusiness(updatedUser.DepartmentId, updatedUser.Position);
            if (!isValidCombination)
                throw new ArgumentException($"Business '{updatedUser.Position}' does not belong to the selected department.");
        }

        // Nếu department thay đổi, cần update references
        if (existingUser.DepartmentId != updatedUser.DepartmentId)
        {
            // Remove user from old department
            if (!string.IsNullOrEmpty(existingUser.DepartmentId))
            {
                var removeUpdate = Builders<Department>.Update.PullFilter(
                    d => d.user,
                    ur => ur.Id == id
                );
                await _departmentsCollection.UpdateOneAsync(
                    d => d.Id == existingUser.DepartmentId,
                    removeUpdate
                );
            }

            // Add user to new department
            if (!string.IsNullOrEmpty(updatedUser.DepartmentId))
            {
                var userRef = new UserReference
                {
                    Id = id,
                    Username = updatedUser.Username
                };

                var addUpdate = Builders<Department>.Update.Push(d => d.user, userRef);
                await _departmentsCollection.UpdateOneAsync(
                    d => d.Id == updatedUser.DepartmentId,
                    addUpdate
                );
            }
        }
        else if (!string.IsNullOrEmpty(updatedUser.DepartmentId) &&
                 existingUser.Username != updatedUser.Username)
        {
            // Username thay đổi nhưng department không đổi - update user reference
            var removeUpdate = Builders<Department>.Update.PullFilter(
                d => d.user,
                ur => ur.Id == id
            );
            await _departmentsCollection.UpdateOneAsync(
                d => d.Id == updatedUser.DepartmentId,
                removeUpdate
            );

            var userRef = new UserReference
            {
                Id = id,
                Username = updatedUser.Username
            };
            var addUpdate = Builders<Department>.Update.Push(d => d.user, userRef);
            await _departmentsCollection.UpdateOneAsync(
                d => d.Id == updatedUser.DepartmentId,
                addUpdate
            );
        }

        updatedUser.Id = id;
        updatedUser.UpdatedAt = DateTime.UtcNow; // Update timestamp
        await _collection.ReplaceOneAsync(x => x.Id == id, updatedUser);

        await _logService.CreateAsync(new UserLog
        {
            UserId = id,
            Action = "UpdateUser",
            Metadata = new { updatedUser.Username, updatedUser.Email, updatedUser.Position, updatedUser.DepartmentId }
        });
    }

    public override async Task DeleteAsync(string id)
    {
        var user = await GetByIdAsync(id);
        if (user != null && !string.IsNullOrEmpty(user.DepartmentId))
        {
            // Remove user from department
            var removeUpdate = Builders<Department>.Update.PullFilter(
                d => d.user,
                ur => ur.Id == id
            );
            await _departmentsCollection.UpdateOneAsync(
                d => d.Id == user.DepartmentId,
                removeUpdate
            );
        }

        await _collection.DeleteOneAsync(x => x.Id == id);
    }

    public async Task<(bool Success, string Message)> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(userId))
                return (false, "User ID is required");

            if (string.IsNullOrWhiteSpace(currentPassword))
                return (false, "Current password is required");

            if (string.IsNullOrWhiteSpace(newPassword))
                return (false, "New password is required");

            // Tìm user theo ID
            var user = await _collection.Find(u => u.Id == userId).FirstOrDefaultAsync();
            if (user == null)
            {
                return (false, "User not found");
            }

            // Verify current password
            var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.Password,
                currentPassword
            );

            if (passwordVerificationResult == PasswordVerificationResult.Failed)
            {
                return (false, "Current password is incorrect");
            }

            // Check if new password is same as current
            var newPasswordVerificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.Password,
                newPassword
            );

            if (newPasswordVerificationResult == PasswordVerificationResult.Success)
            {
                return (false, "New password must be different from current password");
            }

            // Hash new password
            var hashedNewPassword = _passwordHasher.HashPassword(user, newPassword);

            // Update password in database
            var update = Builders<User>.Update
                .Set(u => u.Password, hashedNewPassword)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(
                u => u.Id == userId,
                update
            );

            if (result.ModifiedCount == 0)
            {
                return (false, "Failed to update password in database");
            }

            // Log the action
            try
            {
                await _logService.CreateAsync(new UserLog
                {
                    UserId = user.Id,
                    Action = "ChangePassword",
                    Metadata = new { user.Username, Timestamp = DateTime.UtcNow }
                });
            }
            catch (Exception logEx)
            {
                // Log error but don't fail the password change
                Console.WriteLine($"Failed to log password change: {logEx.Message}");
            }

            return (true, "Password changed successfully");
        }
        catch (Exception ex)
        {
            return (false, $"An error occurred while changing password: {ex.Message}");
        }
    }

    // Helper method để lấy danh sách departments cho UI
    public async Task<List<Department>> GetAllDepartmentsAsync() =>
        await _departmentsCollection.Find(_ => true).ToListAsync();

    // Helper method để lấy businesses của một department cụ thể
    public async Task<List<string>> GetBusinessesByDepartmentAsync(string departmentId)
    {
        var department = await _departmentsCollection
            .Find(d => d.Id == departmentId)
            .FirstOrDefaultAsync();

        return department?.Position ?? new List<string>();
    }
}
}
