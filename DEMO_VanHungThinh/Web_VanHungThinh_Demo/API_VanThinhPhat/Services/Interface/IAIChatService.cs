using API_VanHungThinh.Models.DTO;

namespace API_VanHungThinh.Services.Interface
{
    public interface IAIChatService
    {
        Task<AIChatResponse> AskAsync(AIChatRequest request);
    }
}
