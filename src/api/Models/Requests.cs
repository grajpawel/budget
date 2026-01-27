using System.ComponentModel.DataAnnotations;

namespace Budget.Api.Models.Requests;

public record CreateTransactionRequest(
    [Required] DateTime Date,
    [Required] decimal Amount,
    [Required] string Type,
    [Required] string Description,
    string? CategoryId = null,
    string? Notes = null,
    List<string>? Tags = null
);

public record UpdateTransactionRequest(
    DateTime? Date = null,
    decimal? Amount = null,
    string? Type = null,
    string? Description = null,
    string? CategoryId = null,
    string? Notes = null,
    List<string>? Tags = null
);

public record CreateCategoryRequest(
    [Required] string Name,
    string? Color = null,
    string? Icon = null,
    string Type = "expense"
);

public record UpdateCategoryRequest(
    string? Name = null,
    string? Color = null,
    string? Icon = null
);

public record UpdateProfileRequest(
    string? DisplayName = null,
    string? Currency = null,
    string? DateFormat = null
);

public record CreateRuleRequest(
    [Required] string Pattern,
    [Required] string CategoryId,
    int Priority = 0
);
