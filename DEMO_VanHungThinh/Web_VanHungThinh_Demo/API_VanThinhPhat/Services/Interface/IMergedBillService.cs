using API_VanHungThinh.Models.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_VanHungThinh.Services.Interface
{
    public interface IMergedBillService
    {
        Task<MergedBillDTO?> CreateMergedBillAsync(CreateMergedBillRequest request);
        Task<List<MergedBillDTO>> GetAllMergedBillsAsync();
        Task<MergedBillDTO?> GetMergedBillByIdAsync(string id);
        Task<bool> DeleteMergedBillAsync(string id);
        Task<bool> UpdateMergedBillNotesAsync(string id, string notes);
    }
}