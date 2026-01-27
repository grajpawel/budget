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
public class ProfileController : ControllerBase
{
    private readonly IUserProfileService _profileService;

    public ProfileController(IUserProfileService profileService)
    {
        _profileService = profileService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException();

    private string GetEmail() =>
        User.FindFirstValue(ClaimTypes.Email)
        ?? User.FindFirstValue("email")
        ?? "";

    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> GetProfile()
    {
        var userId = GetUserId();
        var result = await _profileService.GetProfileAsync(userId);

        if (result == null)
        {
            // Create profile on first access
            result = await _profileService.CreateProfileAsync(userId, GetEmail());
        }

        return Ok(result);
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileResponse>> UpdateProfile(
        [FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        var result = await _profileService.UpdateProfileAsync(userId, request);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteProfile()
    {
        var userId = GetUserId();
        await _profileService.DeleteProfileAsync(userId);
        return NoContent();
    }
}
