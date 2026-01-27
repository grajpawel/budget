using Budget.Api.Models.Requests;
using Budget.Api.Models.Responses;

namespace Budget.Api.Services;

public interface IUserProfileService
{
    Task<UserProfileResponse?> GetProfileAsync(string userId);
    Task<UserProfileResponse> CreateProfileAsync(string userId, string email);
    Task<UserProfileResponse> UpdateProfileAsync(string userId, UpdateProfileRequest request);
    Task DeleteProfileAsync(string userId);
}

public class UserProfileService : IUserProfileService
{
    private readonly ILogger<UserProfileService> _logger;
    private readonly ICategoryService _categoryService;

    public UserProfileService(
        ILogger<UserProfileService> logger,
        ICategoryService categoryService)
    {
        _logger = logger;
        _categoryService = categoryService;
    }

    public Task<UserProfileResponse?> GetProfileAsync(string userId)
    {
        _logger.LogInformation("Getting profile for user {UserId}", userId);

        // TODO: Implement DynamoDB get
        return Task.FromResult<UserProfileResponse?>(null);
    }

    public async Task<UserProfileResponse> CreateProfileAsync(string userId, string email)
    {
        _logger.LogInformation("Creating profile for user {UserId}", userId);

        // Create default categories for new user
        await _categoryService.CreateDefaultCategoriesAsync(userId);

        // TODO: Implement DynamoDB put
        return new UserProfileResponse(
            email,
            null,
            "USD",
            "YYYY-MM-DD",
            "free"
        );
    }

    public Task<UserProfileResponse> UpdateProfileAsync(string userId, UpdateProfileRequest request)
    {
        _logger.LogInformation("Updating profile for user {UserId}", userId);

        // TODO: Implement DynamoDB update
        throw new NotImplementedException();
    }

    public Task DeleteProfileAsync(string userId)
    {
        _logger.LogInformation("Deleting profile for user {UserId}", userId);

        // TODO: Implement DynamoDB delete (cascade delete all user data)
        return Task.CompletedTask;
    }
}
