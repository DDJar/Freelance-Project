using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface ICustomerService
    {
        Task<List<CustomerEntity>> GetAsync();
        Task<(List<CustomerEntity>, long)> GetAsync(int page, int pageSize);
        Task<CustomerEntity?> GetAsync(string id);
        Task CreateAsync(CustomerEntity customer);
        Task UpdateAsync(string id, CustomerEntity customer);
        Task DeleteAsync(string id);
        Task<List<CustomerEntity>> GetByFirstNameAsync(string firstName);
        Task<List<CustomerEntity>> SearchAsync(
        string? firstName,
        string? lastName,
        string? email,
        string? phoneNumber,
        string? address,
        string? identifyNumber,
        DateTime? dateOfBirth,
        string? gender,
        string? notes,
        bool partial = false
        );

    }
}
