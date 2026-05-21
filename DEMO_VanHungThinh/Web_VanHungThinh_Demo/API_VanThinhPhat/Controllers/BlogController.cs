using API_VanHungThinh.Models;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogController : ControllerBase
{
    private readonly IBlogService _blogService;
    private readonly INotificationService _notificationService;

    public BlogController(IBlogService blogService, INotificationService notificationService)
    {
        _blogService = blogService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Blog>>> Get() =>
        await _blogService.GetAsync();

    [HttpGet("Published")]
    public async Task<ActionResult<List<Blog>>> GetPublished()
    {
        var blogs = await _blogService.GetPublishedAsync();
        return Ok(blogs);
    }


    [HttpGet("{id:length(24)}")]
    public async Task<ActionResult<Blog>> Get(string id)
    {
        var blog = await _blogService.GetAsync(id);
        if (blog is null) return NotFound();
        return blog;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] Blog blog, IFormFile? image)
    {
        await _blogService.CreateAsync(blog, image);
        await _notificationService.NotifyCreated(EntityType.Blog, blog.Id ?? "", blog);
        return CreatedAtAction(nameof(Get), new { id = blog.Id }, blog);
    }

    [HttpPut("{id:length(24)}")]
    public async Task<IActionResult> Update(string id, [FromForm] Blog updatedBlog, IFormFile? image)
    {
        var blog = await _blogService.GetAsync(id);
        if (blog is null) return NotFound();

        await _blogService.UpdateAsync(id, updatedBlog, image);
        await _notificationService.NotifyUpdated(EntityType.Blog, id, updatedBlog);
        return NoContent();
    }

    [HttpDelete("{id:length(24)}")]
    public async Task<IActionResult> Delete(string id)
    {
        var blog = await _blogService.GetAsync(id);
        if (blog is null) return NotFound();

        await _blogService.DeleteAsync(id);
        await _notificationService.NotifyDeleted(EntityType.Blog, id);
        return NoContent();
    }
    [HttpGet("{blogId:length(24)}/image")]
    public async Task<IActionResult> GetImageByBlogId(string blogId)
    {
        var blog = await _blogService.GetAsync(blogId);
        if (blog == null || string.IsNullOrEmpty(blog.ImageId)) return NotFound();

        var imageBytes = await _blogService.GetImageAsync(blog.ImageId);
        if (imageBytes == null) return NotFound();

        return File(imageBytes, "image/jpeg"); // hoặc dynamic type như image/png nếu có MIME
    }

}
