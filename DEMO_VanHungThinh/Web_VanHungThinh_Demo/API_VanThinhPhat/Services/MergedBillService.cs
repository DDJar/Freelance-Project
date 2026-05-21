using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO;
using API_VanHungThinh.Services.Interface;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API_VanHungThinh.Services
{
    public class MergedBillService : IMergedBillService
    {
        private readonly IMongoCollection<MergedBillEntity> _mergedBills;
        private readonly IMongoCollection<BillEntity> _bills;

        public MergedBillService(IMongoDatabase database)
        {
            _mergedBills = database.GetCollection<MergedBillEntity>("merge_bill");
            _bills = database.GetCollection<BillEntity>("bill");
        }

        public async Task<MergedBillDTO?> CreateMergedBillAsync(CreateMergedBillRequest request)
        {
            if (request.BillIds == null || !request.BillIds.Any())
                throw new ArgumentException("At least one bill ID is required");

            // Normalize: trim, remove empty, distinct
            var billIds = request.BillIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id.Trim())
                .Distinct()
                .ToList();

            if (!billIds.Any())
                throw new ArgumentException("No valid bill IDs provided");
            
            Console.WriteLine($"[DEBUG MergedBillService] Searching for {billIds.Count} bills");
            foreach (var id in billIds)
            {
                Console.WriteLine($"[DEBUG MergedBillService] Bill ID to search: {id}");
            }

            // First, log all bills in database
            var allBills = await _bills.Find(_ => true).Project(b => new { b.Id }).ToListAsync();
            Console.WriteLine($"[DEBUG MergedBillService] Total bills in database: {allBills.Count}");
            foreach (var bill in allBills.Take(10))  // Log first 10
            {
                Console.WriteLine($"[DEBUG MergedBillService] Bill in DB: {bill.Id}");
            }

            // Try to find bills - using FilterDefinition for better control
            var filter = Builders<BillEntity>.Filter.In(b => b.Id, billIds);
            var bills = await _bills.Find(filter).ToListAsync();
            
            Console.WriteLine($"[DEBUG MergedBillService] Found {bills.Count} bills in database");
            foreach (var bill in bills)
            {
                Console.WriteLine($"[DEBUG MergedBillService] Bill found: {bill.Id}");
            }
            
            if (bills.Count != billIds.Count)
            {
                var foundIds = bills.Select(b => b.Id).ToList();
                var missingIds = billIds.Except(foundIds).ToList();
                Console.WriteLine($"[DEBUG MergedBillService] Missing bill IDs ({missingIds.Count}): {string.Join(", ", missingIds)}");
                throw new ArgumentException($"Some bill IDs are invalid. Found: {bills.Count}, Expected: {billIds.Count}");
            }

            using var session = await _bills.Database.Client.StartSessionAsync();
            session.StartTransaction();

            try
            {
                // Tính tổng tiền
                var totalAmount = bills.Sum(b => b.TotalAmount);

                // Lấy thông tin khách hàng từ bill đầu tiên
                var firstBill = bills.First();
                var customerInfo = new MergedBillCustomerInfo
                {
                    Email = firstBill.Email,
                    FirstName = firstBill.FirstName,
                    LastName = firstBill.LastName,
                    Phone = firstBill.Phone,
                    Address = firstBill.Address
                };

                // Tạo merged bill
                var mergedBill = new MergedBillEntity
                {
                    MergedBillNumber = request.MergedBillNumber ?? GenerateMergedBillNumber(DateTime.UtcNow),
                    BillIds = billIds,
                    TotalAmount = totalAmount,
                    MergedDate = DateTime.UtcNow,
                    Status = request.Status ?? "Merged",
                    Notes = request.Notes,
                    CustomerInfo = customerInfo,
                    CreatedBy = request.CreatedBy
                };

                await _mergedBills.InsertOneAsync(session, mergedBill);

                var updateDefinition = Builders<BillEntity>.Update
                    .Set(b => b.Status, request.Status ?? "Merged");

                await _bills.UpdateManyAsync(session, b => billIds.Contains(b.Id!), updateDefinition);

                await session.CommitTransactionAsync();

                // Trả về DTO với thông tin chi tiết
                return new MergedBillDTO
                {
                    Id = mergedBill.Id,
                    MergedBillNumber = mergedBill.MergedBillNumber,
                    BillIds = mergedBill.BillIds,
                    TotalAmount = mergedBill.TotalAmount,
                    MergedDate = mergedBill.MergedDate,
                    Status = mergedBill.Status,
                    Notes = mergedBill.Notes,
                    CustomerInfo = mergedBill.CustomerInfo,
                    CreatedBy = mergedBill.CreatedBy,
                    Bills = bills.Select(b => new BillWithItemsDTO
                    {
                        Id = b.Id,
                        IdentifyNumber = b.IdentifyNumber,
                        InvoiceNumber = b.InvoiceNumber,
                        PaymentMethod = b.PaymentMethod,
                        Notes = b.Notes,
                        BillDate = b.BillDate,
                        Status = request.Status ?? "Merged",
                        TotalAmount = b.TotalAmount,
                        Email = b.Email,
                        FirstName = b.FirstName,
                        LastName = b.LastName,
                        DateOfBirth = b.DateOfBirth,
                        Phone = b.Phone,
                        Address = b.Address
                    }).ToList()
                };
            }
            catch
            {
                await session.AbortTransactionAsync();
                throw;
            }
        }

        public async Task<List<MergedBillDTO>> GetAllMergedBillsAsync()
        {
            var mergedBills = await _mergedBills.Find(_ => true).ToListAsync();

            var result = new List<MergedBillDTO>();
            foreach (var mergedBill in mergedBills)
            {
                var bills = await _bills.Find(b => mergedBill.BillIds.Contains(b.Id!)).ToListAsync();

                result.Add(new MergedBillDTO
                {
                    Id = mergedBill.Id,
                    MergedBillNumber = mergedBill.MergedBillNumber,
                    BillIds = mergedBill.BillIds,
                    TotalAmount = mergedBill.TotalAmount,
                    MergedDate = mergedBill.MergedDate,
                    Status = mergedBill.Status,
                    Notes = mergedBill.Notes,
                    CustomerInfo = mergedBill.CustomerInfo,
                    CreatedBy = mergedBill.CreatedBy,
                    Bills = bills.Select(b => new BillWithItemsDTO
                    {
                        Id = b.Id,
                        IdentifyNumber = b.IdentifyNumber,
                        InvoiceNumber = b.InvoiceNumber,
                        PaymentMethod = b.PaymentMethod,
                        Notes = b.Notes,
                        BillDate = b.BillDate,
                        Status = b.Status,
                        TotalAmount = b.TotalAmount,
                        Email = b.Email,
                        FirstName = b.FirstName,
                        LastName = b.LastName,
                        DateOfBirth = b.DateOfBirth,
                        Phone = b.Phone,
                        Address = b.Address
                    }).ToList()
                });
            }

            return result;
        }

        public async Task<MergedBillDTO?> GetMergedBillByIdAsync(string id)
        {
            var mergedBill = await _mergedBills.Find(m => m.Id == id).FirstOrDefaultAsync();
            if (mergedBill == null) return null;

            var bills = await _bills.Find(b => mergedBill.BillIds.Contains(b.Id!)).ToListAsync();

            return new MergedBillDTO
            {
                Id = mergedBill.Id,
                MergedBillNumber = mergedBill.MergedBillNumber,
                BillIds = mergedBill.BillIds,
                TotalAmount = mergedBill.TotalAmount,
                MergedDate = mergedBill.MergedDate,
                Status = mergedBill.Status,
                Notes = mergedBill.Notes,
                CustomerInfo = mergedBill.CustomerInfo,
                CreatedBy = mergedBill.CreatedBy,
                Bills = bills.Select(b => new BillWithItemsDTO
                {
                    Id = b.Id,
                    IdentifyNumber = b.IdentifyNumber,
                    InvoiceNumber = b.InvoiceNumber,
                    PaymentMethod = b.PaymentMethod,
                    Notes = b.Notes,
                    BillDate = b.BillDate,
                    Status = b.Status,
                    TotalAmount = b.TotalAmount,
                    Email = b.Email,
                    FirstName = b.FirstName,
                    LastName = b.LastName,
                    DateOfBirth = b.DateOfBirth,
                    Phone = b.Phone,
                    Address = b.Address
                }).ToList()
            };
        }

        public async Task<bool> DeleteMergedBillAsync(string id)
        {
            var result = await _mergedBills.DeleteOneAsync(m => m.Id == id);
            return result.DeletedCount > 0;
        }

        public async Task<bool> UpdateMergedBillNotesAsync(string id, string notes)
        {
            var update = Builders<MergedBillEntity>.Update.Set(m => m.Notes, notes);
            var result = await _mergedBills.UpdateOneAsync(m => m.Id == id, update);
            return result.ModifiedCount > 0;
        }

        private string GenerateMergedBillNumber(DateTime mergedDate)
        {
            var year = mergedDate.Year.ToString().Substring(2);
            var month = mergedDate.Month.ToString().PadLeft(2, '0');
            var day = mergedDate.Day.ToString().PadLeft(2, '0');
            var timePart = mergedDate.Ticks.ToString().Substring(mergedDate.Ticks.ToString().Length - 6);
            return $"MB-{year}{month}{day}-{timePart}";
        }
    }
}