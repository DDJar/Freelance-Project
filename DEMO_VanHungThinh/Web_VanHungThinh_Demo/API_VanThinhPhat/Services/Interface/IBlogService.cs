using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface;

public interface IBlogService
{
    Task<List<Blog>> GetAsync();
    Task<Blog?> GetAsync(string id);
    Task CreateAsync(Blog blog, IFormFile? imageFile);
    Task UpdateAsync(string id, Blog updatedBlog, IFormFile? imageFile);
    Task DeleteAsync(string id);
    Task<byte[]?> GetImageAsync(string imageId);
    Task<List<Blog>> GetPublishedAsync();
}
