namespace Budget.Api.Models.Responses;

public record TransactionResponse(
    string Id,
    DateTime Date,
    decimal Amount,
    string Type,
    string Description,
    string? CategoryId,
    string? CategoryName,
    string? Notes,
    List<string>? Tags,
    DateTime CreatedAt
);

public record CategoryResponse(
    string Id,
    string Name,
    string? Color,
    string? Icon,
    string Type,
    bool IsSystem
);

public record UserProfileResponse(
    string Email,
    string? DisplayName,
    string Currency,
    string DateFormat,
    string SubscriptionTier
);

public record DashboardResponse(
    decimal TotalBalance,
    decimal MonthlyIncome,
    decimal MonthlyExpenses,
    int TransactionCount,
    List<CategorySpending> SpendingByCategory,
    List<MonthlyTrend> MonthlyTrends
);

public record CategorySpending(
    string CategoryId,
    string CategoryName,
    string? Color,
    decimal Amount,
    decimal Percentage
);

public record MonthlyTrend(
    string Month,
    decimal Income,
    decimal Expenses
);

public record PagedResponse<T>(
    List<T> Items,
    string? NextToken,
    int TotalCount
);

public record ErrorResponse(
    string Message,
    string? Code = null,
    Dictionary<string, string[]>? Errors = null
);
