using API_VanHungThinh.Models;

namespace API_VanHungThinh.Services.Interface
{
    public interface IRefreshTokenService
    {
        Task<RefreshToken> CreateAsync(string userId, string tokenHash, string? deviceId, DateTime expiresAt, string? userAgent, string? ip);
        Task<RefreshToken?> GetByHashAsync(string tokenHash);
        Task RevokeAsync(string tokenHash, string? replacedByHash = null);
        Task<IEnumerable<RefreshToken>> GetActiveByUserAsync(string userId);
    }
}