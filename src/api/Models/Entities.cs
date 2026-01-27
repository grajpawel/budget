namespace Budget.Api.Models;

/// <summary>
/// Base entity for all DynamoDB items
/// </summary>
public abstract class BaseEntity
{
    public required string PK { get; set; }
    public required string SK { get; set; }
    public string? GSI1PK { get; set; }
    public string? GSI1SK { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// User profile entity
/// PK: USER#{userId}, SK: PROFILE
/// </summary>
public class UserProfile : BaseEntity
{
    public required string UserId { get; set; }
    public required string Email { get; set; }
    public string? DisplayName { get; set; }
    public string Currency { get; set; } = "USD";
    public string DateFormat { get; set; } = "YYYY-MM-DD";
    public string SubscriptionTier { get; set; } = "free";
}

/// <summary>
/// Transaction entity
/// PK: USER#{userId}, SK: TXN#{date}#{txnId}
/// </summary>
public class Transaction : BaseEntity
{
    public required string UserId { get; set; }
    public required string TransactionId { get; set; }
    public required DateTime Date { get; set; }
    public required decimal Amount { get; set; }
    public required string Type { get; set; } // "income" or "expense"
    public required string Description { get; set; }
    public string? CategoryId { get; set; }
    public string? Notes { get; set; }
    public List<string>? Tags { get; set; }
    public string? ImportId { get; set; }
}

/// <summary>
/// Category entity
/// PK: USER#{userId}, SK: CAT#{categoryId}
/// </summary>
public class Category : BaseEntity
{
    public required string UserId { get; set; }
    public required string CategoryId { get; set; }
    public required string Name { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public string Type { get; set; } = "expense"; // "income" or "expense"
    public bool IsSystem { get; set; } = false;
}

/// <summary>
/// Auto-categorization rule entity
/// PK: USER#{userId}, SK: RULE#{ruleId}
/// </summary>
public class CategorizationRule : BaseEntity
{
    public required string UserId { get; set; }
    public required string RuleId { get; set; }
    public required string Pattern { get; set; }
    public required string CategoryId { get; set; }
    public int Priority { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
