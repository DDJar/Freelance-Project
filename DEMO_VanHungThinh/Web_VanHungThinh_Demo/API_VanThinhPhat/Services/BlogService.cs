using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;

namespace API_VanHungThinh.Services;

public class BlogService : IBlogService
{
    private readonly IMongoCollection<Blog> _blogsCollection;
    private readonly GridFSBucket _gridFsBucket;

    public BlogService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient)
    {
        var database = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);
        _blogsCollection = database.GetCollection<Blog>("blog");
        _gridFsBucket = new GridFSBucket(database);
    }

    public async Task<List<Blog>> GetAsync() =>
        await _blogsCollection.Find(_ => true).ToListAsync();

    public async Task<Blog?> GetAsync(string id) =>
        await _blogsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<byte[]?> GetImageAsync(string imageId)
    {
        if (string.IsNullOrEmpty(imageId)) return null;

        try
        {
            var bytes = await _gridFsBucket.DownloadAsBytesAsync(ObjectId.Parse(imageId));
            return bytes;
        }
        catch
        {
            return null;
        }
    }

    public async Task CreateAsync(Blog blog, IFormFile? imageFile)
    {
        blog.CreatedAt = DateTime.UtcNow;
        blog.UpdatedAt = blog.CreatedAt;

        if (imageFile != null)
        {
            using var stream = imageFile.OpenReadStream();
            var imageId = await _gridFsBucket.UploadFromStreamAsync(imageFile.FileName, stream);
            blog.ImageId = imageId.ToString();
        }

        await _blogsCollection.InsertOneAsync(blog);
    }

    public async Task UpdateAsync(string id, Blog updatedBlog, IFormFile? imageFile)
    {
        var existing = await _blogsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (existing == null) return;

        updatedBlog.CreatedAt = existing.CreatedAt;
        updatedBlog.UpdatedAt = DateTime.UtcNow;
        updatedBlog.Id = existing.Id;

        if (imageFile != null)
        {
            if (!string.IsNullOrEmpty(existing.ImageId))
            {
                try { await _gridFsBucket.DeleteAsync(ObjectId.Parse(existing.ImageId)); } catch { }
            }

            using var stream = imageFile.OpenReadStream();
            var imageId = await _gridFsBucket.UploadFromStreamAsync(imageFile.FileName, stream);
            updatedBlog.ImageId = imageId.ToString();
        }
        else
        {
            updatedBlog.ImageId = existing.ImageId;
        }

        await _blogsCollection.ReplaceOneAsync(x => x.Id == id, updatedBlog);
    }

    public async Task DeleteAsync(string id)
    {
        var blog = await _blogsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (blog == null) return;

        if (!string.IsNullOrEmpty(blog.ImageId))
        {
            try { await _gridFsBucket.DeleteAsync(ObjectId.Parse(blog.ImageId)); } catch { }
        }

        await _blogsCollection.DeleteOneAsync(x => x.Id == id);
    }
    public async Task<List<Blog>> GetPublishedAsync()
    {
        var filter = Builders<Blog>.Filter.Eq(b => b.Status, "Published");
        return await _blogsCollection
            .Find(filter)
            .SortByDescending(b => b.CreatedAt) // nếu muốn bài mới nhất lên trước
            .ToListAsync();
    }


}
