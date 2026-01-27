using System.Security.Claims;
using Budget.Api.Models.Requests;
using Budget.Api.Models.Responses;
using Budget.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Budget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<ActionResult<PagedResponse<TransactionResponse>>> GetTransactions(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? categoryId,
        [FromQuery] int limit = 50,
        [FromQuery] string? nextToken = null)
    {
        var userId = GetUserId();
        var result = await _transactionService.GetTransactionsAsync(
            userId, startDate, endDate, categoryId, limit, nextToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TransactionResponse>> GetTransaction(string id)
    {
        var userId = GetUserId();
        var result = await _transactionService.GetTransactionAsync(userId, id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> CreateTransaction(
        [FromBody] CreateTransactionRequest request)
    {
        var userId = GetUserId();
        var result = await _transactionService.CreateTransactionAsync(userId, request);
        return CreatedAtAction(nameof(GetTransaction), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TransactionResponse>> UpdateTransaction(
        string id,
        [FromBody] UpdateTransactionRequest request)
    {
        var userId = GetUserId();
        var result = await _transactionService.UpdateTransactionAsync(userId, id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(string id)
    {
        var userId = GetUserId();
        await _transactionService.DeleteTransactionAsync(userId, id);
        return NoContent();
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
    {
        var userId = GetUserId();
        var result = await _transactionService.GetDashboardAsync(userId);
        return Ok(result);
    }
}
