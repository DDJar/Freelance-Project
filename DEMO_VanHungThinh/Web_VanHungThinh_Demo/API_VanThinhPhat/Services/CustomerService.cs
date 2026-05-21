using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace API_VanHungThinh.Services
{
    public class CustomerService : BaseRepository<CustomerEntity>, ICustomerService
    {
        public CustomerService(IOptions<MongoDbSettings> mongoDbSettings, IMongoClient mongoClient)
            : base(mongoDbSettings, mongoClient, "customer")
        {
        }

        public override async Task<List<CustomerEntity>> GetAsync() =>
            await _collection.Find(_ => true).ToListAsync();

        public override async Task<(List<CustomerEntity>, long)> GetAsync(int page, int pageSize)
        {
            var totalCount = await _collection.CountDocumentsAsync(_ => true);
            var customers = await _collection.Find(_ => true)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();
            return (customers, totalCount);
        }

        public override async Task<CustomerEntity?> GetAsync(string id) =>
            await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public override async Task CreateAsync(CustomerEntity customer)
        {
            customer.CreatedAt = DateTime.UtcNow;
            customer.UpdatedAt = customer.CreatedAt;
            await _collection.InsertOneAsync(customer);
        }

        public override async Task UpdateAsync(string id, CustomerEntity updatedCustomer)
        {
            updatedCustomer.UpdatedAt = DateTime.UtcNow;
            await _collection.ReplaceOneAsync(x => x.Id == id, updatedCustomer);
        }

        public override async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(x => x.Id == id);

        public async Task<List<CustomerEntity>> GetByFirstNameAsync(string firstName)
        {
            return await _collection.Find(c => c.FirstName == firstName).ToListAsync();
        }
        public async Task<List<CustomerEntity>> SearchAsync(
    string? firstName,
    string? lastName,
    string? email,
    string? phoneNumber,
    string? address,
    string? identifyNumber,
    DateTime? dateOfBirth,
    string? gender,
    string? notes,
    bool partial = false)
        {
            var filterBuilder = Builders<CustomerEntity>.Filter;
            var filters = new List<FilterDefinition<CustomerEntity>>();

            // Tìm theo tên (tokenized) và identifyNumber
            if (!string.IsNullOrEmpty(firstName))
            {
                var nameTokens = firstName.Split(new[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                var tokenFilters = new List<FilterDefinition<CustomerEntity>>();

                foreach (var token in nameTokens)
                {
                    var t = token.Trim();
                    if (string.IsNullOrEmpty(t))
                        continue;

                    var regex = new MongoDB.Bson.BsonRegularExpression(t, "i");
                    tokenFilters.Add(
                        filterBuilder.Or(
                            filterBuilder.Regex(c => c.FirstName, regex),
                            filterBuilder.Regex(c => c.LastName, regex),
                            filterBuilder.Regex(c => c.IdentifyNumber, regex)
                        )
                    );
                }

                if (tokenFilters.Any())
                {
                    // Require all tokens to match somewhere in the name/identify fields
                    filters.Add(filterBuilder.And(tokenFilters));
                }
            }

            if (!string.IsNullOrEmpty(email))
                filters.Add(partial ? filterBuilder.Regex(c => c.Email, new MongoDB.Bson.BsonRegularExpression(email, "i")) : filterBuilder.Eq(c => c.Email, email));

            if (!string.IsNullOrEmpty(phoneNumber))
                filters.Add(partial ? filterBuilder.Regex(c => c.PhoneNumber, new MongoDB.Bson.BsonRegularExpression(phoneNumber, "i")) : filterBuilder.Eq(c => c.PhoneNumber, phoneNumber));

            if (!string.IsNullOrEmpty(address))
                filters.Add(partial ? filterBuilder.Regex(c => c.Address, new MongoDB.Bson.BsonRegularExpression(address, "i")) : filterBuilder.Eq(c => c.Address, address));

            if (dateOfBirth.HasValue)
                filters.Add(filterBuilder.Eq(c => c.DateOfBirth, dateOfBirth.Value));

            if (!string.IsNullOrEmpty(gender))
                filters.Add(partial ? filterBuilder.Regex(c => c.Gender, new MongoDB.Bson.BsonRegularExpression(gender, "i")) : filterBuilder.Eq(c => c.Gender, gender));

            if (!string.IsNullOrEmpty(notes))
                filters.Add(partial ? filterBuilder.Regex(c => c.Notes, new MongoDB.Bson.BsonRegularExpression(notes, "i")) : filterBuilder.Eq(c => c.Notes, notes));

            var combinedFilter = filters.Any()
                ? filterBuilder.And(filters)
                : filterBuilder.Empty;

            return await _collection.Find(combinedFilter).ToListAsync();
        }


    }
}
