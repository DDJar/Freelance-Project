using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;

namespace API_VanHungThinh.Services
{
    public class RefreshTokenService : BaseRepository<RefreshToken>, IRefreshTokenService
    {
        public RefreshTokenService(IOptions<MongoDbSettings> options, IMongoClient mongoClient)
            : base(options, mongoClient, "refresh_tokens")
        {
        }

        public async Task<RefreshToken> CreateAsync(string userId, string tokenHash, string? deviceId, DateTime expiresAt, string? userAgent, string? ip)
        {
            var rt = new RefreshToken
            {
                UserId = userId,
                TokenHash = tokenHash,
                DeviceId = deviceId,
                UserAgent = userAgent,
                Ip = ip,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt,
                Revoked = false
            };

            await base.CreateAsync(rt);
            return rt;
        }

        public async Task<RefreshToken?> GetByHashAsync(string tokenHash)
        {
            return await _collection.Find(t => t.TokenHash == tokenHash).FirstOrDefaultAsync();
        }

        public async Task RevokeAsync(string tokenHash, string? replacedByHash = null)
        {
            var update = Builders<RefreshToken>.Update
                .Set(t => t.Revoked, true)
                .Set(t => t.ReplacedByTokenHash, replacedByHash);

            await _collection.UpdateOneAsync(t => t.TokenHash == tokenHash, update);
        }

        public async Task<IEnumerable<RefreshToken>> GetActiveByUserAsync(string userId)
        {
            return await _collection.Find(t => t.UserId == userId && !t.Revoked && t.ExpiresAt > DateTime.UtcNow).ToListAsync();
        }
    }
}