using Budget.Api.Models.Requests;
using Budget.Api.Models.Responses;

namespace Budget.Api.Services;

public interface ICategoryService
{
    Task<List<CategoryResponse>> GetCategoriesAsync(string userId);
    Task<CategoryResponse?> GetCategoryAsync(string userId, string categoryId);
    Task<CategoryResponse> CreateCategoryAsync(string userId, CreateCategoryRequest request);
    Task<CategoryResponse> UpdateCategoryAsync(string userId, string categoryId, UpdateCategoryRequest request);
    Task DeleteCategoryAsync(string userId, string categoryId);
    Task<List<CategoryResponse>> CreateDefaultCategoriesAsync(string userId);
}

public class CategoryService : ICategoryService
{
    private readonly ILogger<CategoryService> _logger;

    private static readonly List<(string Name, string Color, string Icon)> DefaultCategories =
    [
        ("Food & Dining", "#22c55e", "utensils"),
        ("Transportation", "#3b82f6", "car"),
        ("Shopping", "#f59e0b", "shopping-bag"),
        ("Entertainment", "#8b5cf6", "film"),
        ("Bills & Utilities", "#ef4444", "file-text"),
        ("Health", "#ec4899", "heart"),
        ("Travel", "#06b6d4", "plane"),
        ("Education", "#84cc16", "book"),
        ("Income", "#10b981", "dollar-sign"),
    ];

    public CategoryService(ILogger<CategoryService> logger)
    {
        _logger = logger;
    }

    public Task<List<CategoryResponse>> GetCategoriesAsync(string userId)
    {
        _logger.LogInformation("Getting categories for user {UserId}", userId);

        // TODO: Implement DynamoDB query
        return Task.FromResult(new List<CategoryResponse>());
    }

    public Task<CategoryResponse?> GetCategoryAsync(string userId, string categoryId)
    {
        _logger.LogInformation("Getting category {CategoryId} for user {UserId}", categoryId, userId);

        // TODO: Implement DynamoDB get
        return Task.FromResult<CategoryResponse?>(null);
    }

    public Task<CategoryResponse> CreateCategoryAsync(string userId, CreateCategoryRequest request)
    {
        _logger.LogInformation("Creating category for user {UserId}", userId);

        // TODO: Implement DynamoDB put
        var id = Guid.NewGuid().ToString();

        return Task.FromResult(new CategoryResponse(
            id,
            request.Name,
            request.Color,
            request.Icon,
            request.Type,
            false
        ));
    }

    public Task<CategoryResponse> UpdateCategoryAsync(string userId, string categoryId, UpdateCategoryRequest request)
    {
        _logger.LogInformation("Updating category {CategoryId} for user {UserId}", categoryId, userId);

        // TODO: Implement DynamoDB update
        throw new NotImplementedException();
    }

    public Task DeleteCategoryAsync(string userId, string categoryId)
    {
        _logger.LogInformation("Deleting category {CategoryId} for user {UserId}", categoryId, userId);

        // TODO: Implement DynamoDB delete
        return Task.CompletedTask;
    }

    public Task<List<CategoryResponse>> CreateDefaultCategoriesAsync(string userId)
    {
        _logger.LogInformation("Creating default categories for user {UserId}", userId);

        var categories = DefaultCategories.Select((cat, index) => new CategoryResponse(
            $"default-{index}",
            cat.Name,
            cat.Color,
            cat.Icon,
            cat.Name == "Income" ? "income" : "expense",
            true
        )).ToList();

        // TODO: Batch write to DynamoDB
        return Task.FromResult(categories);
    }
}
