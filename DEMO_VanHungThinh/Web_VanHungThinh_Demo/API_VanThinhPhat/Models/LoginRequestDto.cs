// Models/LoginRequest.cs
namespace API_VanHungThinh.Models
{
    public class LoginRequest
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? DeviceId { get; set; } // optional client-provided identifier
    }

    public class RefreshRequest
    {
        public string? RefreshToken { get; set; }
    }

    public class RevokeRequest
    {
        public string? RefreshToken { get; set; }
        public string? DeviceId { get; set; }
    }
}