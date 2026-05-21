using API_VanHungThinh.Models;
using System.Threading.Tasks;

public interface ISettingsService
{
    Task<ProjectSettings?> GetAsync(string key = "global");
    Task<ProjectSettings> UpsertAsync(ProjectSettings settings);
}
