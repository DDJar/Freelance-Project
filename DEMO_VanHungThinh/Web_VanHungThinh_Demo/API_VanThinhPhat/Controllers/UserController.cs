using API_VanHungThinh.Models;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;


namespace API_VanHungThinh.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UserController> _logger;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly INotificationService _notificationService;

    public UserController(IUserService userService, IPasswordHasher<User> passwordHasher, IConfiguration configuration, ILogger<UserController> logger, IRefreshTokenService refreshTokenService, INotificationService notificationService)
    {
        _userService = userService;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
        _refreshTokenService = refreshTokenService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 1000) pageSize = 50;

        var (users, totalCount) = await _userService.GetAllAsync(page, pageSize);
        return Ok(new {
            data = users,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetById(string id)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user == null)
        {
            return NotFound($"User with ID {id} not found");
        }

        return Ok(user);
    }

    [HttpGet("username/{username}")]
    public async Task<ActionResult<User>> GetByUsername(string username)
    {
        var user = await _userService.GetByUsernameAsync(username);

        if (user == null)
        {
            return NotFound($"User with username {username} not found");
        }

        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<User>> Create([FromBody] User user)
    {
        if (string.IsNullOrEmpty(user.Username))
        {
            return BadRequest("Username is required");
        }

        if (string.IsNullOrEmpty(user.Password))
        {
            return BadRequest("Password is required");
        }

        // Check if username already exists
        var existingUser = await _userService.GetByUsernameAsync(user.Username);
        if (existingUser != null)
        {
            return Conflict($"Username {user.Username} already exists");
        }

        // ✅ Truyền password đúng cách
        var createdUser = await _userService.CreateAsync(user, user.Password);
        await _notificationService.NotifyCreated(EntityType.User, createdUser.Id ?? "", createdUser);

        return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, createdUser);
    }


    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, User user)
    {
        var existing = await _userService.GetByIdAsync(id);
        if (existing == null) return NotFound();

        user.Id = id;
        await _userService.UpdateAsync(id, user);
        await _notificationService.NotifyUpdated(EntityType.User, id, user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existingUser = await _userService.GetByIdAsync(id);

        if (existingUser == null)
        {
            return NotFound($"User with ID {id} not found");
        }

        await _userService.DeleteAsync(id);
        await _notificationService.NotifyDeleted(EntityType.User, id);
        return NoContent();
    }

    [HttpPost("register")]
    public async Task<ActionResult<User>> Register([FromBody] Models.RegisterRequest request)
    {
        try
        {
            // Validate request
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest("Username is required");
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Password is required");
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is required");
            }

            var user = await _userService.RegisterAsync(request, _passwordHasher);

            // Hide password in response
            var responseUser = new User
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Address = user.Address,
                PhoneNumber = user.PhoneNumber,
                Gender = user.Gender,
                Role = user.Role,
                Password = "[HIDDEN]"
            };

            return CreatedAtAction(nameof(GetById), new { id = user.Id }, responseUser);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<object>> Login([FromBody] Models.LoginRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is required");
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Password is required");
            }

            var user = await _userService.LoginAsync(request.Email, request.Password, _passwordHasher);

            if (user == null)
            {
                return Unauthorized("Invalid email or password");
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            // Create refresh token
            var refreshString = GenerateRandomToken(64);
            var refreshHash = HashToken(refreshString);
            var refreshExpiryMinutes = Convert.ToInt32(_configuration["Jwt:RefreshExpiryMinutes"] ?? "43200"); // default 30 days
            var refreshExpiresAt = DateTime.UtcNow.AddMinutes(refreshExpiryMinutes);
            var deviceId = request.DeviceId; // optional: extend LoginRequest
            var userAgent = Request.Headers["User-Agent"].ToString();
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            await _refreshTokenService.CreateAsync(user.Id!, refreshHash, deviceId, refreshExpiresAt, userAgent, ip);

            // Return user info without password and the token
            var responseUser = new
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Position = user.Position,
                Address = user.Address,
                Gender = user.Gender,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                DepartmentId = user.DepartmentId
            };

            return Ok(new
            {
                Message = "Login successful",
                User = responseUser,
                AccessToken = token,
                RefreshToken = refreshString,
                ExpiresIn = Convert.ToDouble(_configuration["Jwt:ExpiryMinutes"])
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [Authorize]
    [HttpGet("secure")]
    public IActionResult SecureData()
    {
        return Ok("This is protected");
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, user.Username ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role ?? string.Empty)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryMinutes"])),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashToken(string token)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private static string GenerateRandomToken(int size = 64)
    {
        var bytes = new byte[size];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    [HttpPut("{id}/change-password")]
    public async Task<IActionResult> ChangePassword(string id, [FromBody] ChangePasswordRequest request)
    {
        try
        {
            // Validate request
            if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest("Current password and new password are required");
            }

            if (request.CurrentPassword == request.NewPassword)
            {
                return BadRequest("New password must be different from current password");
            }

            // Optional: Add password strength validation
            if (request.NewPassword.Length < 6)
            {
                return BadRequest("New password must be at least 6 characters long");
            }

            var result = await _userService.ChangePasswordAsync(id, request.CurrentPassword, request.NewPassword);

            if (result.Success)
            {
                _logger.LogInformation($"Password changed successfully for user {id}");
                return Ok(new { message = result.Message });
            }
            else
            {
                if (result.Message.Contains("not found"))
                {
                    return NotFound(result.Message);
                }
                else if (result.Message.Contains("incorrect"))
                {
                    return BadRequest(result.Message);
                }
                else
                {
                    return BadRequest(result.Message);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error changing password for user {id}");
            return StatusCode(500, "Internal server error occurred while changing password");
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken)) return BadRequest("RefreshToken required");
        var incomingHash = HashToken(req.RefreshToken);
        var existing = await _refreshTokenService.GetByHashAsync(incomingHash);
        if (existing == null || existing.Revoked || existing.ExpiresAt <= DateTime.UtcNow)
        {
            return Unauthorized("Invalid or expired refresh token");
        }

        var user = await _userService.GetByIdAsync(existing.UserId);
        if (user == null) return Unauthorized("User not found");

        // Rotate: revoke existing and issue new refresh
        var newRefreshString = GenerateRandomToken(64);
        var newRefreshHash = HashToken(newRefreshString);
        var refreshExpiryMinutes = Convert.ToInt32(_configuration["Jwt:RefreshExpiryMinutes"] ?? "43200");
        var newExpiresAt = DateTime.UtcNow.AddMinutes(refreshExpiryMinutes);

        await _refreshTokenService.RevokeAsync(incomingHash, newRefreshHash);
        await _refreshTokenService.CreateAsync(user.Id!, newRefreshHash, existing.DeviceId, newExpiresAt, existing.UserAgent, existing.Ip);

        var newAccessToken = GenerateJwtToken(user);

        return Ok(new { AccessToken = newAccessToken, RefreshToken = newRefreshString });
    }

    [Authorize]
    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] RevokeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken) && string.IsNullOrWhiteSpace(req.DeviceId))
            return BadRequest("RefreshToken or DeviceId required");

        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (!string.IsNullOrWhiteSpace(req.RefreshToken))
        {
            var hash = HashToken(req.RefreshToken);
            await _refreshTokenService.RevokeAsync(hash, null);
        }
        else if (!string.IsNullOrWhiteSpace(req.DeviceId))
        {
            var tokens = await _refreshTokenService.GetActiveByUserAsync(userId);
            var toRevoke = tokens.Where(t => t.DeviceId == req.DeviceId);
            foreach (var t in toRevoke) await _refreshTokenService.RevokeAsync(t.TokenHash);
        }

        return Ok(new { message = "Revoked" });
    }

    [Authorize]
    [HttpGet("sessions")]
    public async Task<IActionResult> Sessions()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var tokens = await _refreshTokenService.GetActiveByUserAsync(userId);
        var result = tokens.Select(t => new {
            t.Id,
            t.DeviceId,
            t.UserAgent,
            t.Ip,
            t.CreatedAt,
            t.ExpiresAt
        });

        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userService.GetByIdAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        return Ok(user);
    }
}
