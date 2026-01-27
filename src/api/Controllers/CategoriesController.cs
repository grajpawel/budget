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
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> GetCategories()
    {
        var userId = GetUserId();
        var result = await _categoryService.GetCategoriesAsync(userId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryResponse>> GetCategory(string id)
    {
        var userId = GetUserId();
        var result = await _categoryService.GetCategoryAsync(userId, id);

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> CreateCategory(
        [FromBody] CreateCategoryRequest request)
    {
        var userId = GetUserId();
        var result = await _categoryService.CreateCategoryAsync(userId, request);
        return CreatedAtAction(nameof(GetCategory), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryResponse>> UpdateCategory(
        string id,
        [FromBody] UpdateCategoryRequest request)
    {
        var userId = GetUserId();
        var result = await _categoryService.UpdateCategoryAsync(userId, id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        var userId = GetUserId();
        await _categoryService.DeleteCategoryAsync(userId, id);
        return NoContent();
    }
}
